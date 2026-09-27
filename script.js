// Initial Mock Data
const initialTransactions = [
    { id: '1', type: 'EXPENSE', amount: 786400, category: 'Belanja', note: 'Grocery Shopping Walmart', date: '2026-09-28' },
    { id: '2', type: 'EXPENSE', amount: 120000, category: 'Transportasi', note: 'Uber Ride ke Kantor', date: '2026-09-27' },
    { id: '3', type: 'EXPENSE', amount: 450000, category: 'Utilitas', note: 'Tagihan Listrik PLN', date: '2026-09-25' },
    { id: '4', type: 'INCOME', amount: 8500000, category: 'Gaji', note: 'Gaji Bulanan PT Flow', date: '2026-09-20' },
    { id: '5', type: 'EXPENSE', amount: 155000, category: 'Hiburan', note: 'Langganan Netflix', date: '2026-09-18' },
    { id: '6', type: 'EXPENSE', amount: 85000, category: 'Makanan', note: 'Kopi & Snack', date: '2026-09-15' },
    { id: '7', type: 'INCOME', amount: 1200000, category: 'Gaji', note: 'Bonus Freelance Design', date: '2026-09-10' }
];

// Global State
let transactions = JSON.parse(localStorage.getItem('moneyflow_tx')) || initialTransactions;
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

// Toggle Password Input Visibility
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

function handleLogin(e) {
    e.preventDefault();
    
    // Ambil nilai dari input form
    const userVal = document.getElementById('username').value;
    const passVal = document.getElementById('password').value;

    // Tentukan username & password yang benar
    const correctUser = "admin";
    const correctPass = "password123";

    // Cek apakah input sesuai
    if (userVal === correctUser && passVal === correctPass) {
        localStorage.setItem('moneyflow_logged_in', 'true');
        showDashboard();
    } else {
        alert('Username atau Password salah! (Coba: admin / password123)');
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
    updateDashboard();
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

// Save & Delete Transaction
function handleSaveTransaction(e) {
    e.preventDefault();
    const type = document.getElementById('txType').value;
    const amountRaw = document.getElementById('txAmount').value.replace(/\./g, '');
    const category = document.getElementById('txCategory').value;
    const date = document.getElementById('txDate').value;
    const note = document.getElementById('txNote').value || category;

    if (!amountRaw || isNaN(amountRaw)) return;

    const newTx = {
        id: Date.now().toString(),
        type: type,
        amount: parseFloat(amountRaw),
        category: category,
        note: note,
        date: date
    };

    transactions.unshift(newTx);
    localStorage.setItem('moneyflow_tx', JSON.stringify(transactions));
    closeModal();
    updateDashboard();
}

function deleteTransaction(id) {
    if (confirm('Apakah Anda yakin ingin menghapus transaksi ini?')) {
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
    const filteredTx = transactions.filter(tx => tx.date.startsWith(selectedMonth));

    let totalIncome = 0;
    let totalExpense = 0;

    filteredTx.forEach(tx => {
        if (tx.type === 'INCOME') totalIncome += tx.amount;
        if (tx.type === 'EXPENSE') totalExpense += tx.amount;
    });

    const netBalance = totalIncome - totalExpense;
    const budgetLimit = 15000000;
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
    let list = data || transactions.filter(tx => tx.date.startsWith(selectedMonth));

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
        tableBody.innerHTML = `<tr><td colspan="6" class="text-center py-6 text-slate-400">Tidak ada transaksi ditemukan.</td></tr>`;
        mobileCardList.innerHTML = `<div class="text-center py-6 text-slate-400 text-xs">Tidak ada transaksi ditemukan.</div>`;
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
            labels: labels,
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

    // Render Custom Legend
    const legendContainer = document.getElementById('categoryLegend');
    legendContainer.innerHTML = '';
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

    // Trend Line Chart
    const trendIncome = [2000000, 3000000, 4500000, 6000000, 8500000, 9700000];
    const trendExpense = [500000, 1200000, 2100000, 2900000, 3800000, totalExpense || 4200000];

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
    const worksheet = XLSX.utils.json_to_sheet(transactions);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Laporan Keuangan");
    XLSX.writeFile(workbook, `Laporan_Keuangan_MoneyFlow_${new Date().toISOString().substring(0,10)}.xlsx`);
}

function exportToPDF() {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();

    doc.setFontSize(16);
    doc.text("Laporan Bulanan MoneyFlow", 14, 20);
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

    doc.save(`Laporan_MoneyFlow_${new Date().toISOString().substring(0,10)}.pdf`);
}