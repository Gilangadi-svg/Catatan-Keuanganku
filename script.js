const SCRIPT_URL = "https://script.google.com/macros/s/AKfycbxuYYbHe3BIYs9kxaKfntllFlNUHfdxT4eWBbBadU8L5Qe7CjPuxlJD8qmaMFMDenkXsA/exec";

// Global State
let transactions = JSON.parse(localStorage.getItem('moneyflow_tx')) || [];
let categoryChartInstance = null;
let trendChartInstance = null;

// Category Config
const categoryMap = {
    'Makanan': { icon: '🍔', bg: 'bg-emerald-100', text: 'text-emerald-700', color: '#10B981' },
    'Transportasi': { icon: '🚗', bg: 'bg-amber-100', text: 'text-amber-700', color: '#F59E0B' },
    'Gaji': { icon: '💼', bg: 'bg-indigo-100', text: 'text-indigo-700', color: '#6366F1' },
    'Belanja': { icon: '🛒', bg: 'bg-rose-100', text: 'text-rose-700', color: '#F43F5E' },
    'Utilitas': { icon: '⚡', bg: 'bg-sky-100', text: 'text-sky-700', color: '#0EA5E9' },
    'Hiburan': { icon: '🎬', bg: 'bg-purple-100', text: 'text-purple-700', color: '#A855F7' },
    'Lainnya': { icon: '📦', bg: 'bg-slate-100', text: 'text-slate-700', color: '#64748B' }
};

// Initialize App
document.addEventListener('DOMContentLoaded', () => {
    const txDateInput = document.getElementById('txDate');
    if (txDateInput) txDateInput.value = new Date().toISOString().substring(0, 10);

    if (localStorage.getItem('moneyflow_logged_in') === 'true') {
        showDashboard();
    }
});

// Fetch Data from Google Sheets
async function loadTransactionsFromSheet() {
    try {
        const response = await fetch(SCRIPT_URL);
        const data = await response.json();
        
        if (Array.isArray(data)) {
            // Pemetaan data dari Google Sheets ke format internal aplikasi
            transactions = data.map(item => ({
                id: item.id ? item.id.toString() : Date.now().toString(),
                date: item.tanggal ? String(item.tanggal).substring(0, 10) : new Date().toISOString().substring(0, 10),
                type: item.tipe || 'EXPENSE',
                category: item.kategori || 'Lainnya',
                amount: parseFloat(item.nominal) || 0,
                note: item.catatan || ''
            }));
            
            // Urutkan dari transaksi terbaru
            transactions.reverse();
            localStorage.setItem('moneyflow_tx', JSON.stringify(transactions));
            updateDashboard();
        }
    } catch (error) {
        console.error("Gagal mengambil data dari Google Sheets:", error);
    }
}

// Toggle Password Visibility
function togglePasswordVisibility() {
    const passwordInput = document.getElementById('password');
    const eyeIcon = document.getElementById('eyeIcon');
    if (passwordInput.type === 'password') {
        passwordInput.type = 'text';
        eyeIcon.classList.replace('fa-eye', 'fa-eye-slash');
    } else {
        passwordInput.type = 'password';
        eyeIcon.classList.replace('fa-eye-slash', 'fa-eye');
    }
}

// Authentication Handler
function handleLogin(e) {
    e.preventDefault();
    const userVal = document.getElementById('username').value.trim();
    const passVal = document.getElementById('password').value.trim();

    if (userVal === "Adi" && passVal === "Adi123") {
        localStorage.setItem('moneyflow_logged_in', 'true');
        showDashboard();
    } else {
        alert('Username atau Password salah!\n\nGunakan:\nUsername: Adi\nPassword: Adi123');
    }
}

function handleLogout() {
    localStorage.removeItem('moneyflow_logged_in');
    document.getElementById('dashboardView').classList.add('hidden');
    document.getElementById('loginView').classList.remove('hidden');
}

function showDashboard() {
    document.getElementById('loginView').classList.add('hidden');
    document.getElementById('dashboardView').classList.remove('hidden');
    
    // Tampilkan data lokal dulu agar cepat, lalu sync dengan Google Sheets
    updateDashboard();
    loadTransactionsFromSheet();
}

// Rupiah Formatters
function formatRupiah(number) {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(number);
}

function formatRupiahInput(input) {
    let value = input.value.replace(/\D/g, '');
    if (value) {
        input.value = new Intl.NumberFormat('id-ID').format(value);
    } else {
        input.value = '';
    }
}

// Modal Handlers
function openModal() {
    const modal = document.getElementById('transactionModal');
    modal.classList.remove('opacity-0', 'pointer-events-none');
    modal.children[0].classList.remove('translate-y-full');
}

function closeModal() {
    const modal = document.getElementById('transactionModal');
    modal.children[0].classList.add('translate-y-full');
    modal.classList.add('opacity-0', 'pointer-events-none');
    document.getElementById('transactionForm').reset();
    setTransactionType('EXPENSE');
}

function setTransactionType(type) {
    document.getElementById('txType').value = type;
    const btnExpense = document.getElementById('btnExpense');
    const btnIncome = document.getElementById('btnIncome');

    if (type === 'EXPENSE') {
        btnExpense.className = 'py-2.5 rounded-lg text-xs font-bold transition-all bg-white text-rose-600 shadow-sm';
        btnIncome.className = 'py-2.5 rounded-lg text-xs font-bold transition-all text-slate-500';
    } else {
        btnIncome.className = 'py-2.5 rounded-lg text-xs font-bold transition-all bg-white text-emerald-600 shadow-sm';
        btnExpense.className = 'py-2.5 rounded-lg text-xs font-bold transition-all text-slate-500';
    }
}

// Save Transaction to Google Sheets
async function handleSaveTransaction(e) {
    e.preventDefault();
    const saveBtn = e.target.querySelector('button[type="submit"]');
    const originalBtnText = saveBtn ? saveBtn.innerText : '';

    const type = document.getElementById('txType').value;
    const amountRaw = document.getElementById('txAmount').value.replace(/\./g, '');
    const category = document.getElementById('txCategory').value;
    const date = document.getElementById('txDate').value;
    const note = document.getElementById('txNote').value || category;

    if (!amountRaw || isNaN(amountRaw)) return;

    const payload = {
        id: Date.now().toString(),
        tanggal: date,
        tipe: type,
        kategori: category,
        nominal: parseFloat(amountRaw),
        catatan: note
    };

    if (saveBtn) {
        saveBtn.disabled = true;
        saveBtn.innerText = 'Menyimpan...';
    }

    try {
        // Kirim data ke Google Sheets
        await fetch(SCRIPT_URL, {
            method: 'POST',
            body: JSON.stringify(payload)
        });

        // Tambahkan ke memori lokal
        transactions.unshift({
            id: payload.id,
            date: payload.tanggal,
            type: payload.tipe,
            category: payload.kategori,
            amount: payload.nominal,
            note: payload.catatan
        });

        localStorage.setItem('moneyflow_tx', JSON.stringify(transactions));
        closeModal();
        updateDashboard();
    } catch (error) {
        alert('Gagal menyimpan transaksi ke Google Sheets. Periksa koneksi internet Anda.');
        console.error(error);
    } finally {
        if (saveBtn) {
            saveBtn.disabled = false;
            saveBtn.innerText = originalBtnText;
        }
    }
}

function deleteTransaction(id) {
    if (confirm('Apakah Anda yakin ingin menghapus transaksi ini dari aplikasi?')) {
        transactions = transactions.filter(tx => tx.id !== id);
        localStorage.setItem('moneyflow_tx', JSON.stringify(transactions));
        updateDashboard();
    }
}

function filterDataByMonth() {
    updateDashboard();
}

// Update Dashboard UI & Charts
function updateDashboard() {
    const selectedMonth = document.getElementById('monthYearFilter').value;
    const filteredTx = transactions.filter(tx => tx.date && tx.date.startsWith(selectedMonth));

    let totalIncome = 0;
    let totalExpense = 0;

    filteredTx.forEach(tx => {
        if (tx.type === 'INCOME') totalIncome += tx.amount;
        if (tx.type === 'EXPENSE') totalExpense += tx.amount;
    });

    const netBalance = totalIncome - totalExpense;
    const budgetLimit = 10000000;
    const budgetPercent = Math.min(Math.round((totalExpense / budgetLimit) * 100), 100);

    document.getElementById('statExpense').innerText = formatRupiah(totalExpense);
    document.getElementById('statIncome').innerText = formatRupiah(totalIncome);
    document.getElementById('statBalance').innerText = formatRupiah(netBalance);
    document.getElementById('statBudgetPercent').innerText = budgetPercent + '%';
    document.getElementById('statProgressBar').style.width = budgetPercent + '%';
    document.getElementById('totalTxCount').innerText = filteredTx.length + ' Transaksi';

    renderTransactions(filteredTx);
    renderCharts(filteredTx);
}

// Render Table & Cards
function renderTransactions(data = null) {
    const selectedMonth = document.getElementById('monthYearFilter').value;
    let list = data || transactions.filter(tx => tx.date && tx.date.startsWith(selectedMonth));

    const searchValue = document.getElementById('searchInput').value.toLowerCase();
    const categoryValue = document.getElementById('categoryFilter').value;

    if (searchValue) {
        list = list.filter(tx => tx.note.toLowerCase().includes(searchValue) || tx.category.toLowerCase().includes(searchValue));
    }

    if (categoryValue !== 'ALL') {
        list = list.filter(tx => tx.category === categoryValue);
    }

    const tableBody = document.getElementById('transactionTableBody');
    const mobileCardList = document.getElementById('transactionCardList');

    tableBody.innerHTML = '';
    mobileCardList.innerHTML = '';

    if (list.length === 0) {
        tableBody.innerHTML = `<tr><td colspan="6" class="text-center py-8 text-slate-400">Belum ada transaksi. Klik <strong>+ Tambah</strong> untuk memasukkan data baru.</td></tr>`;
        mobileCardList.innerHTML = `<div class="text-center py-8 text-slate-400 text-xs">Belum ada transaksi. Klik tombol + untuk menambah.</div>`;
        return;
    }

    list.forEach(tx => {
        const cat = categoryMap[tx.category] || categoryMap['Lainnya'];
        const isExpense = tx.type === 'EXPENSE';
        const amountFormatted = (isExpense ? '-' : '+') + formatRupiah(tx.amount);
        const amountColor = isExpense ? 'text-rose-500 font-bold' : 'text-emerald-500 font-bold';

        // Desktop Row
        const tr = document.createElement('tr');
        tr.className = 'hover:bg-slate-50/80 transition-all';
        tr.innerHTML = `
            <td class="py-3 px-4 font-medium text-slate-500">${tx.date}</td>
            <td class="py-3 px-4 font-semibold text-slate-800">${tx.note}</td>
            <td class="py-3 px-4">
                <span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold ${cat.bg} ${cat.text}">
                    <span>${cat.icon}</span> ${tx.category}
                </span>
            </td>
            <td class="py-3 px-4">
                <span class="text-[10px] font-bold px-2 py-0.5 rounded ${isExpense ? 'bg-rose-50 text-rose-600' : 'bg-emerald-50 text-emerald-600'}">
                    ${isExpense ? 'Pengeluaran' : 'Pemasukan'}
                </span>
            </td>
            <td class="py-3 px-4 text-right ${amountColor}">${amountFormatted}</td>
            <td class="py-3 px-4 text-center">
                <button onclick="deleteTransaction('${tx.id}')" class="text-slate-400 hover:text-rose-500 transition-all">
                    <i class="fa-regular fa-trash-can"></i>
                </button>
            </td>
        `;
        tableBody.appendChild(tr);

        // Mobile Card
        const card = document.createElement('div');
        card.className = 'p-3.5 bg-white border border-slate-100 rounded-xl flex items-center justify-between shadow-sm';
        card.innerHTML = `
            <div class="flex items-center gap-3">
                <div class="w-10 h-10 rounded-xl ${cat.bg} ${cat.text} flex items-center justify-center text-lg">
                    ${cat.icon}
                </div>
                <div>
                    <h4 class="text-xs font-bold text-slate-800">${tx.note}</h4>
                    <p class="text-[10px] text-slate-400 mt-0.5">${tx.date} &bull; ${tx.category}</p>
                </div>
            </div>
            <div class="text-right">
                <p class="text-xs ${amountColor}">${amountFormatted}</p>
                <button onclick="deleteTransaction('${tx.id}')" class="text-[10px] text-slate-400 hover:text-rose-500 mt-1">
                    Hapus
                </button>
            </div>
        `;
        mobileCardList.appendChild(card);
    });
}

// Render Chart.js
function renderCharts(filteredTx) {
    const categoryTotals = {};
    let totalExpense = 0;

    filteredTx.filter(tx => tx.type === 'EXPENSE').forEach(tx => {
        categoryTotals[tx.category] = (categoryTotals[tx.category] || 0) + tx.amount;
        totalExpense += tx.amount;
    });

    const labels = Object.keys(categoryTotals);
    const dataValues = Object.values(categoryTotals);
    const bgColors = labels.map(label => (categoryMap[label] ? categoryMap[label].color : '#64748B'));

    // Donut Chart
    const ctxCat = document.getElementById('categoryChart').getContext('2d');
    if (categoryChartInstance) categoryChartInstance.destroy();

    categoryChartInstance = new Chart(ctxCat, {
        type: 'doughnut',
        data: {
            labels: labels.length > 0 ? labels : ['Belum Ada Data'],
            datasets: [{
                data: dataValues.length > 0 ? dataValues : [1],
                backgroundColor: dataValues.length > 0 ? bgColors : ['#E2E8F0'],
                borderWidth: 2,
                borderColor: '#ffffff'
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            cutout: '75%',
            plugins: { legend: { display: false } }
        }
    });

    // Custom Legend
    const legendContainer = document.getElementById('categoryLegend');
    legendContainer.innerHTML = '';
    if (labels.length === 0) {
        legendContainer.innerHTML = `<p class="text-center text-slate-400 text-xs">Belum ada pengeluaran dicatat.</p>`;
    } else {
        labels.forEach((label) => {
            const amount = categoryTotals[label];
            const percent = totalExpense > 0 ? Math.round((amount / totalExpense) * 100) : 0;
            const cat = categoryMap[label] || categoryMap['Lainnya'];

            const item = document.createElement('div');
            item.className = 'flex items-center justify-between';
            item.innerHTML = `
                <div class="flex items-center gap-2">
                    <span class="w-2.5 h-2.5 rounded-full" style="background-color: ${cat.color}"></span>
                    <span class="font-medium">${cat.icon} ${label}</span>
                </div>
                <div class="font-bold text-slate-800">${formatRupiah(amount)} <span class="text-[10px] text-slate-400 font-normal">(${percent}%)</span></div>
            `;
            legendContainer.appendChild(item);
        });
    }

    // Trend Line Chart
    const trendIncome = [0, 0, 0, 0, 0, 0];
    const trendExpense = [0, 0, 0, 0, 0, 0];

    filteredTx.forEach(tx => {
        const day = parseInt(tx.date.split('-')[2] || '1', 10);
        let idx = Math.min(Math.floor((day - 1) / 5), 5);
        if (tx.type === 'INCOME') trendIncome[idx] += tx.amount;
        if (tx.type === 'EXPENSE') trendExpense[idx] += tx.amount;
    });

    const ctxTrend = document.getElementById('trendChart').getContext('2d');
    if (trendChartInstance) trendChartInstance.destroy();

    trendChartInstance = new Chart(ctxTrend, {
        type: 'line',
        data: {
            labels: ['Tgl 1-5', 'Tgl 6-10', 'Tgl 11-15', 'Tgl 16-20', 'Tgl 21-25', 'Tgl 26-30'],
            datasets: [
                {
                    label: 'Pemasukan',
                    data: trendIncome,
                    borderColor: '#10B981',
                    backgroundColor: 'rgba(16, 185, 129, 0.08)',
                    fill: true,
                    tension: 0.4
                },
                {
                    label: 'Pengeluaran',
                    data: trendExpense,
                    borderColor: '#F43F5E',
                    backgroundColor: 'rgba(244, 63, 94, 0.08)',
                    fill: true,
                    tension: 0.4
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { position: 'top', labels: { boxWidth: 12, font: { size: 10 } } }
            },
            scales: {
                x: { grid: { display: false }, ticks: { font: { size: 10 } } },
                y: { grid: { color: '#F1F5F9' }, ticks: { font: { size: 10 } } }
            }
        }
    });
}

// Export Handlers
function exportToExcel() {
    if (transactions.length === 0) return alert('Tidak ada data transaksi untuk diekspor!');
    const worksheet = XLSX.utils.json_to_sheet(transactions);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Laporan Keuangan");
    XLSX.writeFile(workbook, `Laporan_Keuangan_Adi_${new Date().toISOString().substring(0,10)}.xlsx`);
}

function exportToPDF() {
    if (transactions.length === 0) return alert('Tidak ada data transaksi untuk diekspor!');
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();

    doc.setFontSize(16);
    doc.text("Laporan Keuangan Adi ", 14, 20);
    doc.setFontSize(10);
    doc.text(`Tanggal Cetak: ${new Date().toLocaleDateString('id-ID')}`, 14, 28);

    let startY = 38;
    doc.text("Tanggal | Deskripsi | Kategori | Tipe | Nominal", 14, startY);
    doc.line(14, startY + 2, 196, startY + 2);

    startY += 10;
    transactions.forEach(tx => {
        const line = `${tx.date} | ${tx.note} | ${tx.category} | ${tx.type} | Rp ${tx.amount.toLocaleString('id-ID')}`;
        doc.text(line, 14, startY);
        startY += 7;
        if (startY > 280) {
            doc.addPage();
            startY = 20;
        }
    });

    doc.save(`Laporan_Keuangan_Adi_${new Date().toISOString().substring(0,10)}.pdf`);
}