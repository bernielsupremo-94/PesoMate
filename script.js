// ========================================
// PESOMATE - MAIN APPLICATION
// ========================================

const STORAGE_KEY = "pesomate_settings_v1";

const defaultAllocation = [
    { name: "Necessities", percent: 60, color: "#1976e9" },
    { name: "Emergency Fund", percent: 20, color: "#20b957" },
    { name: "Savings", percent: 10, color: "#8655db" },
    { name: "Education", percent: 5, color: "#e99a28" },
    { name: "Investment", percent: 5, color: "#e94b63" }
];

let allocation = loadAllocation();

function loadAllocation() {
    try {
        const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));

        if (
            Array.isArray(saved) &&
            saved.length > 0 &&
            saved.every(item =>
                typeof item.name === "string" &&
                Number.isFinite(item.percent) &&
                item.percent >= 0 &&
                typeof item.color === "string"
            )
        ) {
            return saved;
        }
    } catch (error) {
        console.warn("Could not load allocation settings.", error);
    }

    return defaultAllocation.map(item => ({ ...item }));
}

// ========================================
// DATE
// ========================================

function displayDate() {
    const date = new Date();

    document.getElementById("todayDate").textContent =
        date.toLocaleDateString("en-PH", {
            month: "short",
            day: "numeric",
            year: "numeric"
        });
}

// ========================================
// MONEY FORMAT
// ========================================

function money(amount) {
    return new Intl.NumberFormat("en-PH", {
        style: "currency",
        currency: "PHP",
        minimumFractionDigits: 2
    }).format(amount);
}

// ========================================
// MONEY JAR
// ========================================

function renderMoneyJar() {

    const necessities = allocation[0]?.percent || 0;

    const otherFunds = allocation
        .slice(1)
        .reduce((sum, item) => sum + item.percent, 0);

    const total = allocation.reduce(
        (sum, item) => sum + item.percent, 0
    );

    // Calculate total earned income, excluding utang collections
    const totalIncome = getTotalIncome();

    // Calculate fund allocations
    const necessitiesAmount = totalIncome * necessities / 100;
    const otherFundsAmount = totalIncome * otherFunds / 100;

    // Expenses are deducted from Necessities only
    const totalExpenses = getTotalExpenseAmount();

    const necessitiesRemaining = Math.max(
        0,
        necessitiesAmount - totalExpenses
    );

    // Update Money Jar percentage
    document.getElementById("jarPercentage").textContent =
        `${necessities}/${otherFunds}`;

    // Update Money Jar visual
    document.getElementById("necessitiesSegment").style.height =
        `${necessities}%`;

    document.getElementById("savingsSegment").style.height =
        `${otherFunds}%`;

    // Update fund details
    const details = document.getElementById("allocationDetails");

    details.innerHTML = `
        <div class="allocation-row redesigned-fund-card">

            <div class="fund-card-heading">
                <span class="allocation-dot"
                      style="background:${allocation[0]?.color || '#1976e9'}">
                </span>

                <div class="fund-card-label">
                    <strong>Necessities Fund</strong>
                    <small>For daily needs and essential expenses</small>
                </div>
            </div>

            <div class="fund-card-amount necessities-amount">
                ${money(necessitiesAmount)}
            </div>

            <div class="fund-card-percentage">
                ${necessities}% Allocation
            </div>

        </div>


        <div class="allocation-row redesigned-fund-card">

            <div class="fund-card-heading">
                <span class="allocation-dot"
                      style="background:#20b957">
                </span>

                <div class="fund-card-label">
                    <strong>Other Funds</strong>
                    <small>For savings, goals, and other priorities</small>
                </div>
            </div>

            <div class="fund-card-amount other-funds-amount">
                ${money(otherFundsAmount)}
            </div>

            <div class="fund-card-percentage">
                ${otherFunds}% Allocation
            </div>

        </div>


        <div class="allocation-remaining-card">

            <div class="remaining-heading">
                <span class="remaining-icon">🎯</span>

                <div>
                    <strong>Left in Necessities Fund</strong>
                    <small>
                        After recorded expenses: ${money(totalExpenses)}
                    </small>
                </div>
            </div>

            <div class="remaining-amount">
                ${money(necessitiesRemaining)}
            </div>

        </div>
    `;

    // Update total allocated money
    document.getElementById("jarTotal").textContent =
        money(totalIncome);

    // Update allocation percentage
    document.getElementById("allocationPercentageTotal").textContent =
        `${total}%`;

    document.getElementById("allocationPercentageTotal").style.color =
        total === 100 ? "#20b957" : "#e94b63";
}

// ========================================
// ALLOCATION SETTINGS
// ========================================

const allocationModal = document.getElementById("allocationModal");

function openAllocation() {

    const container = document.getElementById("allocationInputs");

    container.innerHTML = "";

    allocation.forEach((item, index) => {

        const row = document.createElement("div");
        row.className = "allocation-input-row";

        const label = document.createElement("label");
        label.textContent = item.name;
        label.htmlFor = `allocation-${index}`;

        const input = document.createElement("input");

        input.type = "number";
        input.min = "0";
        input.max = "100";
        input.step = "1";
        input.value = item.percent;
        input.id = `allocation-${index}`;

        input.addEventListener("input", updateAllocationTotal);

        row.append(label, input);

        container.appendChild(row);
    });

    updateAllocationTotal();

    allocationModal.classList.add("show");
}

function updateAllocationTotal() {

    let total = 0;

    allocation.forEach((item, index) => {

        const input = document.getElementById(`allocation-${index}`);

        if (input) {
            const value = Number(input.value);

            if (input.value.trim() !== "" && Number.isFinite(value)) {
                total += value;
            }
        }
    });

    const totalElement =
        document.getElementById("allocationPercentageTotal");

    const message =
        document.getElementById("allocationMessage");

    const saveButton =
        document.getElementById("saveAllocation");

    totalElement.textContent = `${total}%`;

    if (total === 100) {

        totalElement.style.color = "#20b957";

        message.textContent = "Perfect! Your allocation totals 100%.";
        message.style.color = "#20b957";

        saveButton.disabled = false;

    } else {

        totalElement.style.color = "#e94b63";

        message.textContent =
            `Your allocation currently totals ${total}%. It must equal 100%.`;

        message.style.color = "#e94b63";

        saveButton.disabled = true;
    }
}

function saveAllocation() {

    const updated = allocation.map((item, index) => {

        const input = document.getElementById(`allocation-${index}`);

        return {
            ...item,
            percent: Number(input.value)
        };
    });

    const total = updated.reduce(
        (sum, item) => sum + item.percent, 0
    );

    if (
        updated.some(item =>
            !Number.isInteger(item.percent) ||
            item.percent < 0 ||
            item.percent > 100
        ) ||
        total !== 100
    ) {
        alert("Please make sure all allocations total exactly 100%.");
        return;
    }

    allocation = updated;

    localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify(allocation)
    );

    renderMoneyJar();

    allocationModal.classList.remove("show");

    showMessage("Money Jar allocation updated successfully!");
}

// ========================================
// NAVIGATION
// ========================================

function navigateTo(pageId) {

    document.querySelectorAll(".page").forEach(page => {
        page.classList.remove("active");
    });

    const target = document.getElementById(pageId);

    if (!target) return;

    target.classList.add("active");

    document.querySelectorAll(".nav-item").forEach(button => {
        button.classList.toggle(
            "active",
            button.dataset.page === pageId
        );
    });

    window.scrollTo({
        top: 0,
        behavior: "smooth"
    });
}

document.querySelectorAll("[data-page]").forEach(button => {

    button.addEventListener("click", () => {
        navigateTo(button.dataset.page);
    });

});

// ========================================
// MODULE ACTIONS
// ========================================

document.querySelectorAll("[data-action]").forEach(button => {

    button.addEventListener("click", () => {

        const module = button.dataset.action;

        if (module === "income") {
            navigateTo("incomePage");
            renderIncomeRecords();
            return;
        }
        if (module === "expenses") {
        navigateTo("expensePage");
        renderExpenseRecords();
        return;
        }
        if (module === "budget") {
        navigateTo("budgetPage");
        renderBudgetSimulator();
        return;
        }
        if (module === "grocery") {
        navigateTo("groceryPage");
        renderGroceryList();
        return;
        }
        if (module === "bills") {
        navigateTo("billsPage");
        renderBills();
        return;
        }
if (module === "receivables") {
    navigateTo("receivablesPage");
    renderReceivables();
    return;
}
if (module === "payables") {
    navigateTo("payablesPage");
    renderPayables();
    return;
}

if (module === "purchase") {
    navigateTo("purchasePage");
    renderBeforeYouBuy();
    return;
}
if (module === "theme") {
    navigateTo("themePage");
    
    const savedTheme = localStorage.getItem("pesomateTheme") || "light";

    document.querySelectorAll('input[name="appTheme"]').forEach(input => {
        input.checked = input.value === savedTheme;
    });

    return;
}

if (module === "about") {
    navigateTo("aboutPage");
    return;
}
                
if (module === "survival") {
    navigateTo("survivalPage");
    renderSurvivalCalculator();
    return;
}
        showMessage(
            `${module.charAt(0).toUpperCase() + module.slice(1)} module will be developed in the next phase.`
        );

    });

});

// ========================================
// NOTIFICATION MESSAGE
// ========================================

function showMessage(message) {

    let notification = document.getElementById("appNotification");

    if (!notification) {

        notification = document.createElement("div");

        notification.id = "appNotification";

        notification.style.cssText = `
            position:fixed;
            bottom:95px;
            left:50%;
            transform:translateX(-50%);
            background:#092e58;
            color:white;
            padding:13px 18px;
            border-radius:12px;
            font-size:13px;
            width:max-content;
            max-width:90%;
            text-align:center;
            z-index:200;
            box-shadow:0 5px 20px rgba(0,0,0,.2);
        `;

        document.body.appendChild(notification);
    }

    notification.textContent = message;
    notification.style.display = "block";

    clearTimeout(window.notificationTimer);

    window.notificationTimer = setTimeout(() => {
        notification.style.display = "none";
    }, 2500);
}

// ========================================
// EVENT LISTENERS
// ========================================

document.getElementById("manageAllocation")
    .addEventListener("click", openAllocation);
// MONEY JAR GUIDE BUTTONS

const jarGuideModal = document.getElementById("jarGuideModal");

document.getElementById("openJarGuide")
    .addEventListener("click", () => {
        jarGuideModal.classList.add("show");
    });

document.getElementById("closeJarGuide")
    .addEventListener("click", () => {
        jarGuideModal.classList.remove("show");
    });

document.getElementById("guideManageAllocation")
    .addEventListener("click", () => {
        jarGuideModal.classList.remove("show");
        openAllocation();
    });

jarGuideModal.addEventListener("click", event => {
    if (event.target === jarGuideModal) {
        jarGuideModal.classList.remove("show");
    }
});

document.getElementById("openMoneyJar")
    .addEventListener("click", openAllocation);

document.getElementById("closeAllocation")
    .addEventListener("click", () => {
        allocationModal.classList.remove("show");
    });

document.getElementById("saveAllocation")
    .addEventListener("click", saveAllocation);

allocationModal.addEventListener("click", event => {

    if (event.target === allocationModal) {
        allocationModal.classList.remove("show");
    }

});
// ========================================
// INCOME MANAGEMENT
// ========================================

const INCOME_STORAGE_KEY = "pesomate_income_records_v1";

let incomeRecords = [];

try {
    incomeRecords = JSON.parse(
        localStorage.getItem(INCOME_STORAGE_KEY) || "[]"
    );

    if (!Array.isArray(incomeRecords)) incomeRecords = [];

} catch (error) {
    incomeRecords = [];
}

let editingIncomeId = null;

function saveIncomeRecords() {
    localStorage.setItem(
        INCOME_STORAGE_KEY,
        JSON.stringify(incomeRecords)
    );
}

function getTotalIncome() {
    return incomeRecords
        .filter(item => item.source !== "Utang Collection")
        .reduce((sum, item) => sum + Number(item.amount || 0), 0);
}

function renderIncomeRecords() {

    const container = document.getElementById("incomeRecordsList");

    if (!container) return;

    container.innerHTML = "";

    const records = [...incomeRecords].sort(
        (a, b) => b.date.localeCompare(a.date)
    );

    if (records.length === 0) {
        container.innerHTML = `
            <div class="income-empty">
                No income records yet.
            </div>
        `;
    }

    records.forEach(item => {

        const record = document.createElement("div");
        record.className = "income-record";

        const title = document.createElement("strong");
        title.textContent = item.description || item.source;

        const amount = document.createElement("strong");
        amount.textContent = money(Number(item.amount));

        const source = document.createElement("small");
        source.textContent = item.source;

        const date = document.createElement("small");
        date.textContent = item.date;

        const remarks = document.createElement("small");
        remarks.textContent = item.remarks || "";

        const details = document.createElement("div");
        details.append(title, source, date, remarks);

        const top = document.createElement("div");
        top.className = "income-record-top";
        top.append(details, amount);

        const actions = document.createElement("div");
        actions.className = "income-record-actions";

        const edit = document.createElement("button");
        edit.className = "income-edit";
        edit.textContent = "EDIT";
        edit.onclick = () => editIncome(item.id);

        const remove = document.createElement("button");
        remove.className = "income-delete";
        remove.textContent = "DELETE";
        remove.onclick = () => deleteIncome(item.id);

        actions.append(edit, remove);

        record.append(top, actions);
        container.appendChild(record);
    });

    updateIncomeDashboard();
}

function updateIncomeDashboard() {

    // Earned income for the current month
    const total = getTotalIncome();

    document.getElementById("monthlyIncome").textContent =
        money(total);

    document.getElementById("incomePageMonthlyTotal").textContent =
        money(total);

    // Calculate all cash received
    const totalCashReceived = incomeRecords.reduce(
        (sum, item) => sum + Number(item.amount || 0),
        0
    );

    // Calculate all recorded expenses
    const totalExpenses = expenseRecords.reduce(
        (sum, item) => sum + Number(item.amount || 0),
        0
    );

    // Deduct expenses from total cash received
    const availableMoney = totalCashReceived - totalExpenses;

    document.getElementById("totalMoney").textContent =
        money(availableMoney);

    // Update the dashboard expense counter
    const expenseDisplay = document.getElementById("monthlyExpenses");

    if (expenseDisplay) {
        expenseDisplay.textContent = money(totalExpenses);
    }
        // Update Where Your Money Goes card
    document.getElementById("dashboardCashReceived").textContent =
        money(totalCashReceived);

    document.getElementById("dashboardCashExpenses").textContent =
        money(totalExpenses);

    document.getElementById("dashboardCashBalance").textContent =
        money(availableMoney);
}

function openIncomeForm() {

    editingIncomeId = null;

    document.getElementById("incomeFormTitle").textContent =
        "Add New Income";

    document.getElementById("incomeDate").value =
        new Date().toLocaleDateString("en-CA");

    document.getElementById("incomeSource").value = "Salary";
    document.getElementById("incomeDescription").value = "";
    document.getElementById("incomeAmount").value = "";
    document.getElementById("incomeRemarks").value = "";

    document.getElementById("incomeFormContainer").style.display =
        "block";
}

function closeIncomeForm() {

    document.getElementById("incomeFormContainer").style.display =
        "none";

    editingIncomeId = null;
}

function saveIncome() {

    const date = document.getElementById("incomeDate").value;
    const source = document.getElementById("incomeSource").value;
    const description = document.getElementById("incomeDescription").value.trim();
    const amount = Number(document.getElementById("incomeAmount").value);
    const remarks = document.getElementById("incomeRemarks").value.trim();

    if (!date || !description || !Number.isFinite(amount) || amount <= 0) {
        alert("Please complete all required fields and enter a valid amount.");
        return;
    }

    const record = {
        id: editingIncomeId || Date.now().toString(),
        date,
        source,
        description,
        amount,
        remarks
    };

    if (editingIncomeId) {

        incomeRecords = incomeRecords.map(item =>
            item.id === editingIncomeId ? record : item
        );

    } else {

        incomeRecords.push(record);

    }

    saveIncomeRecords();
    closeIncomeForm();
    renderIncomeRecords();

    showMessage("Income record saved successfully!");
}

function editIncome(id) {

    const item = incomeRecords.find(record => record.id === id);

    if (!item) return;

    editingIncomeId = id;

    document.getElementById("incomeFormTitle").textContent = "Edit Income";
    document.getElementById("incomeDate").value = item.date;
    document.getElementById("incomeSource").value = item.source;
    document.getElementById("incomeDescription").value = item.description;
    document.getElementById("incomeAmount").value = item.amount;
    document.getElementById("incomeRemarks").value = item.remarks || "";

    document.getElementById("incomeFormContainer").style.display =
        "block";
}

function deleteIncome(id) {

    if (!confirm("Delete this income record?")) return;

    incomeRecords = incomeRecords.filter(item => item.id !== id);

    saveIncomeRecords();
    renderIncomeRecords();

    showMessage("Income record deleted.");
}

// ========================================
// INCOME BUTTON CONNECTIONS
// ========================================

document.addEventListener("click", function(event) {

    if (event.target.closest("#addIncomeButton")) {
        openIncomeForm();
    }

    if (event.target.closest("#saveIncomeButton")) {
        event.preventDefault();
        saveIncome();
    }

    if (event.target.closest("#cancelIncomeButton")) {
        event.preventDefault();
        closeIncomeForm();
    }

});
// ==========================================
// EXPENSE MANAGEMENT
// ==========================================

const EXPENSE_STORAGE_KEY = "pesomate_expense_records_v1";

let expenseRecords = [];

try {
    expenseRecords = JSON.parse(
        localStorage.getItem(EXPENSE_STORAGE_KEY)
    ) || [];
} catch (error) {
    expenseRecords = [];
}

let editingExpenseId = null;


// SAVE EXPENSE RECORDS
function saveExpenseRecords() {
    localStorage.setItem(
        EXPENSE_STORAGE_KEY,
        JSON.stringify(expenseRecords)
    );
}


// GET TOTAL EXPENSES - ALL DATES
function getTotalExpenseAmount() {
    return expenseRecords.reduce((total, record) => {
        return total + Number(record.amount);
    }, 0);
}


// DISPLAY EXPENSE RECORDS
function renderExpenseRecords() {
    const list = document.getElementById("expenseRecordsList");

    if (!list) return;

    const totalExpenses = getTotalExpenseAmount();

    const monthlyElement = document.getElementById(
        "expensePageMonthlyTotal"
    );

    const countElement = document.getElementById(
        "expenseRecordCount"
    );

    if (monthlyElement) {
        monthlyElement.textContent =
            "₱" + totalExpenses.toLocaleString("en-PH", {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2
            });
    }
    // UPDATE DASHBOARD EXPENSE TOTAL
const dashboardExpenseElement =
    document.getElementById("monthlyExpenses");

if (dashboardExpenseElement) {
    dashboardExpenseElement.textContent =
        "₱" + totalExpenses.toLocaleString("en-PH", {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        });
}

    if (countElement) {
        countElement.textContent = expenseRecords.length;
    }

    if (expenseRecords.length === 0) {
        list.innerHTML = `
            <div class="empty-state">
                <p>No expense records yet.</p>
                <p>Add your first expense to get started.</p>
            </div>
        `;
    } else {
        const sortedRecords = [...expenseRecords].sort(
            (a, b) => new Date(b.date) - new Date(a.date)
        );

        list.innerHTML = sortedRecords.map(record => `
            <div class="income-record-card expense-record-card">

                <div class="income-record-details">
                    <h4>${escapeExpenseText(record.description)}</h4>

                    <p>
                        ${escapeExpenseText(record.category)}
                        • ${formatExpenseDate(record.date)}
                    </p>

                    <p>
                        Payment: ${escapeExpenseText(record.paymentMethod)}
                    </p>

                    ${record.remarks ? `
                        <p>${escapeExpenseText(record.remarks)}</p>
                    ` : ""}
                </div>

                <div class="income-record-right">
                    <strong class="expense-record-amount">
                        -₱${Number(record.amount).toLocaleString("en-PH", {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2
                        })}
                    </strong>

                    <div class="income-record-actions">
                        <button type="button"
                            data-edit-expense="${record.id}">
                            Edit
                        </button>

                        <button type="button"
                            data-delete-expense="${record.id}">
                            Delete
                        </button>
                    </div>
                </div>

            </div>
        `).join("");
    }

    renderExpenseCategorySummary();
    updateIncomeDashboard();
}


// DISPLAY CATEGORY SUMMARY
function renderExpenseCategorySummary() {
    const summary = document.getElementById(
        "expenseCategorySummary"
    );

    if (!summary) return;

    const categoryTotals = {};

    expenseRecords.forEach(record => {
        const category = record.category;

        categoryTotals[category] =
            (categoryTotals[category] || 0) +
            Number(record.amount);
    });

    const categories = Object.entries(categoryTotals);

    if (categories.length === 0) {
        summary.innerHTML = "<p>No expenses recorded yet.</p>";
        return;
    }

    summary.innerHTML = categories
        .sort((a, b) => b[1] - a[1])
        .map(([category, amount]) => `
            <div class="expense-category-row">
                <span>${escapeExpenseText(category)}</span>
                <strong>
                    ₱${amount.toLocaleString("en-PH", {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2
                    })}
                </strong>
            </div>
        `).join("");
}


// FORMAT DATE
function formatExpenseDate(dateString) {
    const date = new Date(dateString + "T00:00:00");

    return date.toLocaleDateString("en-PH", {
        day: "2-digit",
        month: "short",
        year: "numeric"
    });
}


// SAFELY DISPLAY TEXT
function escapeExpenseText(value) {
    return String(value ?? "").replace(/[&<>"']/g, character => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;"
    })[character]);
}


// OPEN NEW EXPENSE FORM
function openExpenseForm() {
    editingExpenseId = null;

    document.getElementById("expenseFormTitle").textContent =
        "Add New Expense";

    document.getElementById("expenseDate").value =
        new Date().toISOString().slice(0, 10);

    document.getElementById("expenseCategory").value = "";
    document.getElementById("expenseDescription").value = "";
    document.getElementById("expenseAmount").value = "";
    document.getElementById("expensePaymentMethod").value = "";
    document.getElementById("expenseRemarks").value = "";

    document.getElementById("expenseFormContainer").style.display =
        "block";
}


// CLOSE EXPENSE FORM
function closeExpenseForm() {
    document.getElementById("expenseFormContainer").style.display =
        "none";

    editingExpenseId = null;
}


// SAVE OR UPDATE EXPENSE
function saveExpense() {
    const date = document.getElementById("expenseDate").value;
    const category = document.getElementById("expenseCategory").value;
    const description = document.getElementById("expenseDescription").value.trim();
    const amount = Number(document.getElementById("expenseAmount").value);
    const paymentMethod = document.getElementById("expensePaymentMethod").value;
    const remarks = document.getElementById("expenseRemarks").value.trim();

    if (!date || !category || !description || !paymentMethod) {
        showMessage("Please complete all required fields.");
        return;
    }

    if (!Number.isFinite(amount) || amount <= 0) {
        showMessage("Please enter a valid expense amount.");
        return;
    }

    const expenseData = {
        date,
        category,
        description,
        amount,
        paymentMethod,
        remarks
    };

    if (editingExpenseId !== null) {
        expenseRecords = expenseRecords.map(record =>
            record.id === editingExpenseId
                ? { ...record, ...expenseData }
                : record
        );

        showMessage("Expense updated successfully.");
    } else {
        expenseRecords.push({
            id: Date.now().toString(),
            ...expenseData
        });

        showMessage("Expense saved successfully.");
    }

    saveExpenseRecords();
    renderExpenseRecords();
    closeExpenseForm();
}


// EDIT EXPENSE
function editExpense(id) {
    const record = expenseRecords.find(
        item => item.id === id
    );

    if (!record) return;

    editingExpenseId = id;

    document.getElementById("expenseFormTitle").textContent =
        "Edit Expense";

    document.getElementById("expenseDate").value = record.date;
    document.getElementById("expenseCategory").value = record.category;
    document.getElementById("expenseDescription").value = record.description;
    document.getElementById("expenseAmount").value = record.amount;
    document.getElementById("expensePaymentMethod").value = record.paymentMethod;
    document.getElementById("expenseRemarks").value = record.remarks || "";

    document.getElementById("expenseFormContainer").style.display =
        "block";

    document.getElementById("expenseFormContainer").scrollIntoView({
        behavior: "smooth",
        block: "start"
    });
}


// DELETE EXPENSE
function deleteExpense(id) {
    const confirmed = confirm(
        "Are you sure you want to delete this expense record?"
    );

    if (!confirmed) return;

    expenseRecords = expenseRecords.filter(
        record => record.id !== id
    );

    saveExpenseRecords();
    renderExpenseRecords();

    showMessage("Expense deleted successfully.");
}


// EXPENSE BUTTON CONNECTIONS
document.addEventListener("click", function(event) {

    if (event.target.closest("#addExpenseButton")) {
        openExpenseForm();
    }

    if (event.target.closest("#saveExpenseButton")) {
        event.preventDefault();
        saveExpense();
    }

    if (event.target.closest("#cancelExpenseButton")) {
        event.preventDefault();
        closeExpenseForm();
    }

    const editButton = event.target.closest("[data-edit-expense]");

    if (editButton) {
        editExpense(editButton.dataset.editExpense);
    }

    const deleteButton = event.target.closest("[data-delete-expense]");

    if (deleteButton) {
        deleteExpense(deleteButton.dataset.deleteExpense);
    }

});
// ========================================
// GROCERY CHECKLIST
// ========================================

const GROCERY_STORAGE_KEY = "pesomate_grocery_v1";

let groceryData = JSON.parse(
    localStorage.getItem(GROCERY_STORAGE_KEY) ||
    '{"budget":0,"items":[],"history":[]}'
);
let editingGroceryItemId = null;

if (!Array.isArray(groceryData.items)) groceryData.items = [];
if (!Array.isArray(groceryData.history)) groceryData.history = [];

function saveGroceryData() {
    localStorage.setItem(
        GROCERY_STORAGE_KEY,
        JSON.stringify(groceryData)
    );
}

// ACTUAL REMAINING NECESSITIES FUND
function getAvailableNecessities() {

    const necessitiesPercent = allocation[0]?.percent || 0;

    const necessitiesAllocation =
        getTotalIncome() * necessitiesPercent / 100;

    const totalExpenses = getTotalExpenseAmount();

    return Math.max(0, necessitiesAllocation - totalExpenses);
}

// DISPLAY GROCERY BUDGET AND ITEMS
function renderGroceryList() {

    const available = getAvailableNecessities();

    const budgetInput = document.getElementById("groceryBudgetInput");
    const budgetDisplay = document.getElementById("groceryBudgetDisplay");

    const totalElement = document.getElementById("groceryEstimatedTotal");
    const remainingElement = document.getElementById("groceryBudgetRemaining");
    const necessitiesElement = document.getElementById("budgetNecessitiesAvailable");

    const list = document.getElementById("groceryItemsList");

    if (!list) return;

    if (budgetInput) budgetInput.value = groceryData.budget || "";

    if (budgetDisplay) budgetDisplay.textContent = money(groceryData.budget);

    if (necessitiesElement) {
        necessitiesElement.textContent = money(available);
    }

    const estimatedTotal = groceryData.items.reduce(
        (sum, item) => sum + item.quantity * item.price,
        0
    );

    if (totalElement) {
        totalElement.textContent = money(estimatedTotal);
    }

    if (remainingElement) {
        remainingElement.textContent =
            money(groceryData.budget - estimatedTotal);
    }

    list.innerHTML = "";

    if (groceryData.items.length === 0) {
        list.innerHTML =
            '<div class="grocery-empty">Your shopping list is empty.</div>';
    }

    groceryData.items.forEach(item => {

        const row = document.createElement("div");
        row.className = "grocery-item-row";

        const checkbox = document.createElement("input");
        checkbox.type = "checkbox";
        checkbox.checked = item.purchased;

        checkbox.addEventListener("change", () => {
            item.purchased = checkbox.checked;
            saveGroceryData();
        });

        const details = document.createElement("div");
        details.className = "grocery-item-details";

        const name = document.createElement("strong");
        name.textContent = item.name;

        const quantity = document.createElement("small");
        quantity.textContent =
            `${item.quantity} ${item.unit} × ${money(item.price)}`;

        details.append(name, quantity);

        const amount = document.createElement("strong");
        amount.textContent =
            money(item.quantity * item.price);

// EDIT BUTTON
const edit = document.createElement("button");
edit.type = "button";
edit.textContent = "✎";
edit.className = "grocery-edit-button";
edit.setAttribute("aria-label", "Edit " + item.name);

edit.addEventListener("click", () => {

    editingGroceryItemId = item.id;

    document.getElementById("groceryItemName").value = item.name;
    document.getElementById("groceryItemQuantity").value = item.quantity;
    document.getElementById("groceryItemUnit").value = item.unit;
    document.getElementById("groceryItemPrice").value = item.price;

    document.querySelector(".grocery-modal-header h3").textContent =
        "Edit Grocery Item";

    updateGroceryItemTotal();

    document.getElementById("groceryItemForm").style.display = "block";
});

// DELETE BUTTON
const remove = document.createElement("button");
remove.type = "button";
remove.textContent = "×";
remove.className = "grocery-delete-button";
remove.setAttribute("aria-label", "Remove " + item.name);

remove.addEventListener("click", () => {

    groceryData.items = groceryData.items.filter(
        current => current.id !== item.id
    );

    saveGroceryData();
    renderGroceryList();
});

row.append(checkbox, details, amount, edit, remove);
list.appendChild(row);
    });

    const message = document.getElementById("groceryBudgetWarning");

    if (message) {
        message.textContent =
            estimatedTotal > groceryData.budget
                ? "Your grocery items exceed the planned budget. You may increase it within your available Necessities Fund."
                : "";
    }

    if (estimatedTotal > available) {
        showMessage("Your grocery items exceed your available Necessities Fund.");
    }
}
// RESET GROCERY BUDGET AND CURRENT SHOPPING LIST
document.getElementById("resetGroceryAll")
    .addEventListener("click", () => {

        if (!confirm(
            "Reset your planned grocery budget and delete all current grocery items? Your Shopping History will remain safe."
        )) {
            return;
        }

        groceryData.budget = 0;
        groceryData.items = [];

        saveGroceryData();
        renderGroceryList();

        showMessage("Grocery budget and shopping list have been reset.");
    });

// SAVE OR INCREASE GROCERY BUDGET
document.getElementById("saveGroceryBudget")
    .addEventListener("click", () => {

        const input = document.getElementById("groceryBudgetInput");
        const newBudget = Number(input.value);

        const available = getAvailableNecessities();

        if (!Number.isFinite(newBudget) || newBudget <= 0) {
            showMessage("Please enter a valid grocery budget.");
            return;
        }

        if (newBudget > available) {
            showMessage(
                "Budget exceeds your available Necessities Fund of " +
                money(available)
            );
            input.value = groceryData.budget || "";
            return;
        }

        groceryData.budget = newBudget;

        saveGroceryData();
        renderGroceryList();

        showMessage("Grocery budget saved successfully.");
    });

// OPEN ADD ITEM FORM
document.getElementById("addGroceryItemButton")
    .addEventListener("click", () => {

        editingGroceryItemId = null;

        document.getElementById("groceryItemName").value = "";
        document.getElementById("groceryItemQuantity").value = "";
        document.getElementById("groceryItemUnit").value = "";
        document.getElementById("groceryItemPrice").value = "";

        document.querySelector(".grocery-modal-header h3").textContent =
            "Add Grocery Item";

        updateGroceryItemTotal();

        document.getElementById("groceryItemForm").style.display = "block";
    });


// CANCEL ITEM FORM
document.getElementById("cancelGroceryItem")
    .addEventListener("click", () => {

        editingGroceryItemId = null;

        document.getElementById("groceryItemForm").style.display = "none";
    });


// SAVE OR UPDATE GROCERY ITEM
document.getElementById("saveGroceryItem")
    .addEventListener("click", () => {

        const name = document.getElementById("groceryItemName").value.trim();
        const quantity = Number(document.getElementById("groceryItemQuantity").value);
        const unit = document.getElementById("groceryItemUnit").value.trim();
        const price = Number(document.getElementById("groceryItemPrice").value);

        if (!name || !unit || quantity <= 0 ||
            !Number.isFinite(quantity) ||
            !Number.isFinite(price) || price < 0) {

            showMessage("Please enter valid grocery item details.");
            return;
        }

        if (editingGroceryItemId !== null) {

            // UPDATE EXISTING ITEM
            groceryData.items = groceryData.items.map(item => {

                if (item.id === editingGroceryItemId) {
                    return {
                        ...item,
                        name,
                        quantity,
                        unit,
                        price
                    };
                }

                return item;
            });

            showMessage("Grocery item updated successfully.");

        } else {

            // ADD NEW ITEM
            groceryData.items.push({
                id: Date.now().toString(),
                name,
                quantity,
                unit,
                price,
                purchased: false
            });

            showMessage("Grocery item added.");
        }

        editingGroceryItemId = null;

        saveGroceryData();

        document.getElementById("groceryItemName").value = "";
        document.getElementById("groceryItemQuantity").value = "";
        document.getElementById("groceryItemUnit").value = "";
        document.getElementById("groceryItemPrice").value = "";

        document.getElementById("groceryItemForm").style.display = "none";

        document.querySelector(".grocery-modal-header h3").textContent =
            "Add Grocery Item";

        renderGroceryList();
    });
// SAVE SHOPPING LIST TO HISTORY
document.getElementById("saveShoppingList")
    .addEventListener("click", () => {

        if (groceryData.items.length === 0) {
            showMessage("Your shopping list is empty.");
            return;
        }

        groceryData.history.push({
            date: new Date().toISOString().slice(0, 10),
            budget: groceryData.budget,
            items: [...groceryData.items]
        });

        saveGroceryData();

        showMessage("Shopping list saved to history.");
    });

// VIEW SHOPPING HISTORY
document.getElementById("viewShoppingHistory")
    .addEventListener("click", () => {

        const history = document.getElementById("groceryHistory");

        history.style.display =
            history.style.display === "none" ? "block" : "none";

        if (history.style.display === "none") return;

        if (groceryData.history.length === 0) {
            history.textContent = "No saved shopping lists yet.";
            return;
        }

        history.innerHTML = "";

        groceryData.history.slice().reverse().forEach(entry => {

            const card = document.createElement("div");
            card.className = "grocery-history-card";

            const title = document.createElement("strong");
            title.textContent = entry.date;

            const amount = document.createElement("p");
            amount.textContent = "Planned Budget: " + money(entry.budget);

            const load = document.createElement("button");
            load.type = "button";
            load.textContent = "REUSE THIS LIST";

            load.addEventListener("click", () => {
                groceryData.items = entry.items.map(item => ({
                    ...item,
                    id: Date.now().toString() + Math.random(),
                    purchased: false
                }));

                groceryData.budget = entry.budget;

                saveGroceryData();
                renderGroceryList();

                document.getElementById("groceryHistory").style.display = "none";

                showMessage("Previous shopping list restored.");
            });

            card.append(title, amount, load);
            history.appendChild(card);
        });
    });
    
// =====================================
// GROCERY ITEM POPUP CALCULATOR
// =====================================

function updateGroceryItemTotal() {

    const quantity = Number(
        document.getElementById("groceryItemQuantity").value
    );

    const price = Number(
        document.getElementById("groceryItemPrice").value
    );

    const total = quantity * price;

    document.getElementById("groceryItemTotal").textContent =
        "₱" + (Number.isFinite(total) ? total : 0).toLocaleString(
            "en-PH",
            {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2
            }
        );
}

document.getElementById("groceryItemQuantity")
    .addEventListener("input", updateGroceryItemTotal);

document.getElementById("groceryItemPrice")
    .addEventListener("input", updateGroceryItemTotal);


// CLOSE POPUP USING X BUTTON

document.getElementById("closeGroceryModal")
    .addEventListener("click", function() {
        document.getElementById("groceryItemForm").style.display = "none";
    });
    

// ========================================
// PESOMATE - RECEIVABLES
// MONEY OWED TO YOU
// ========================================

const RECEIVABLES_STORAGE_KEY = "pesomate_receivables_v1";
const RECEIVABLES_ARCHIVE_KEY = "pesomate_receivables_archive_v1";

let receivableRecords = [];
let receivablesArchive = [];
let editingBorrowerId = null;
let selectedPaymentBorrowerId = null;
let selectedHistoryBorrowerId = null;

// LOAD ACTIVE BORROWER RECORDS
try {
    receivableRecords = JSON.parse(
        localStorage.getItem(RECEIVABLES_STORAGE_KEY) || "[]"
    );

    if (!Array.isArray(receivableRecords)) {
        receivableRecords = [];
    }
} catch (error) {
    receivableRecords = [];
}

// LOAD ARCHIVED BORROWER RECORDS
try {
    receivablesArchive = JSON.parse(
        localStorage.getItem(RECEIVABLES_ARCHIVE_KEY) || "[]"
    );

    if (!Array.isArray(receivablesArchive)) {
        receivablesArchive = [];
    }
} catch (error) {
    receivablesArchive = [];
}


// SAVE ACTIVE RECORDS
function saveReceivables() {
    localStorage.setItem(
        RECEIVABLES_STORAGE_KEY,
        JSON.stringify(receivableRecords)
    );
}


// SAVE ARCHIVED RECORDS
function saveReceivablesArchive() {
    localStorage.setItem(
        RECEIVABLES_ARCHIVE_KEY,
        JSON.stringify(receivablesArchive)
    );
}


// FORMAT RECEIVABLE AMOUNTS
function receivableMoney(amount) {
    return money(Number(amount) || 0);
}


// CALCULATE TOTAL PAYMENTS RECEIVED
function getBorrowerPaid(borrower) {
    return (borrower.payments || []).reduce(
        (sum, payment) => sum + Number(payment.amount || 0),
        0
    );
}


// CALCULATE OUTSTANDING BALANCE
function getBorrowerOutstanding(borrower) {
    return Math.max(
        0,
        Number(borrower.amount || 0) - getBorrowerPaid(borrower)
    );
}


// DETERMINE PAYMENT STATUS
function getBorrowerStatus(borrower) {
    const paid = getBorrowerPaid(borrower);
    const amount = Number(borrower.amount || 0);

    if (paid <= 0) return "Unpaid";
    if (paid >= amount) return "Fully Paid";

    return "Partially Paid";
}


// GET ALL ACTIVE AND ARCHIVED BORROWERS
function getAllReceivableBorrowers() {
    const archived = receivablesArchive.flatMap(
        batch => batch.records || []
    );

    return [...receivableRecords, ...archived];
}


// CHECK WHETHER A BORROWER WAS PREVIOUSLY ASSESSED IRRESPONSIBLE
function getBorrowerAssessment(name, contact) {
    const normalizedName = name.trim().toLowerCase();
    const normalizedContact = (contact || "").replace(/\D/g, "");

    return getAllReceivableBorrowers().find(borrower => {
        const sameName =
            String(borrower.name || "").trim().toLowerCase() === normalizedName;

        const savedContact =
            String(borrower.contact || "").replace(/\D/g, "");

        const sameContact =
            !normalizedContact ||
            !savedContact ||
            normalizedContact === savedContact;

        return (
            sameName &&
            sameContact &&
            borrower.assessment === "Irresponsible"
        );
    });
}


// SHOW WARNING WHEN ENTERING A PREVIOUSLY ASSESSED BORROWER
function checkBorrowerWarning() {
    const name = document.getElementById("borrowerName").value.trim();
    const contact = document.getElementById("borrowerContact").value.trim();
    const warning = document.getElementById("borrowerWarning");

    if (!warning) return;

    if (!name) {
        warning.style.display = "none";
        warning.textContent = "";
        return;
    }

    const previous = getBorrowerAssessment(name, contact);

    if (previous) {
        warning.textContent =
            "⚠️ WARNING: This borrower was previously assessed as IRRESPONSIBLE. " +
            "Previous record: " + previous.name +
            (previous.contact ? " (" + previous.contact + ")" : "") +
            ". Please review carefully before lending again.";

        warning.style.display = "block";
    } else {
        warning.style.display = "none";
        warning.textContent = "";
    }
}


// UPDATE BORROWER SUMMARY
function renderReceivables() {
    const list = document.getElementById("receivablesList");

    if (!list) return;

    const outstanding = receivableRecords.reduce(
        (sum, borrower) => sum + getBorrowerOutstanding(borrower),
        0
    );

    const unpaid = receivableRecords.filter(
        borrower => getBorrowerStatus(borrower) === "Unpaid"
    ).length;

    const partial = receivableRecords.filter(
        borrower => getBorrowerStatus(borrower) === "Partially Paid"
    ).length;

    const fullyPaid = receivableRecords.filter(
        borrower => getBorrowerStatus(borrower) === "Fully Paid"
    ).length;

    const collected = receivableRecords.reduce(
        (sum, borrower) => sum + getBorrowerPaid(borrower),
        0
    );

    document.getElementById("receivablesOutstanding").textContent =
        receivableMoney(outstanding);

    document.getElementById("receivablesUnpaidCount").textContent =
        unpaid;

    document.getElementById("receivablesPartialCount").textContent =
        partial;

    document.getElementById("receivablesPaidCount").textContent =
        fullyPaid;

    document.getElementById("receivablesCollected").textContent =
        receivableMoney(collected);

    list.innerHTML = "";

    if (receivableRecords.length === 0) {
        list.innerHTML =
            '<div class="empty-state">No borrower records yet.</div>';
        return;
    }

    const sorted = [...receivableRecords].sort(
        (a, b) => String(b.date || "").localeCompare(String(a.date || ""))
    );

    sorted.forEach(borrower => {
        const paid = getBorrowerPaid(borrower);
        const balance = getBorrowerOutstanding(borrower);
        const status = getBorrowerStatus(borrower);

        const card = document.createElement("div");
        card.className = "receivable-borrower-card";

        const details = document.createElement("div");

        const name = document.createElement("h3");
        name.textContent = borrower.name;

        const relationship = document.createElement("p");
        relationship.textContent =
            "Relationship: " + (borrower.relationship || "Not specified");

        const date = document.createElement("p");
        date.textContent = "Date Borrowed: " + (borrower.date || "—");

        const purpose = document.createElement("p");
        purpose.textContent = "Purpose: " + (borrower.purpose || "—");

        const dueDate = document.createElement("p");
        dueDate.textContent =
            "When to Pay: " + (borrower.dueDate || "Not specified");

        const contact = document.createElement("p");
        contact.textContent =
            "Contact: " + (borrower.contact || "Not provided");

        const original = document.createElement("p");
        original.textContent =
            "Amount Borrowed: " + receivableMoney(borrower.amount);

        const paidText = document.createElement("p");
        paidText.textContent = "Total Collected: " + receivableMoney(paid);

        const balanceText = document.createElement("strong");
        balanceText.textContent =
            "Outstanding: " + receivableMoney(balance);

        const statusText = document.createElement("span");
        statusText.className =
            "receivable-status " + status.toLowerCase().replaceAll(" ", "-");
        statusText.textContent = status;

        const assessment = document.createElement("p");
        assessment.textContent =
            "Borrower Assessment: " +
            (borrower.assessment || "Not yet assessed");

        details.append(
            name,
            relationship,
            date,
            purpose,
            dueDate,
            contact,
            original,
            paidText,
            balanceText,
            statusText,
            assessment
        );

        const actions = document.createElement("div");
        actions.className = "receivables-card-actions";

        const paymentButton = document.createElement("button");
        paymentButton.type = "button";
        paymentButton.textContent = "RECORD PAYMENT";
        paymentButton.disabled = balance <= 0;
        paymentButton.addEventListener("click", () => {
            openBorrowerPayment(borrower.id);
        });

        const historyButton = document.createElement("button");
        historyButton.type = "button";
        historyButton.textContent = "PAYMENT HISTORY";
        historyButton.addEventListener("click", () => {
            openBorrowerHistory(borrower.id);
        });

        const editButton = document.createElement("button");
        editButton.type = "button";
        editButton.textContent = "EDIT";
        editButton.addEventListener("click", () => {
            editBorrower(borrower.id);
        });

        const deleteButton = document.createElement("button");
        deleteButton.type = "button";
        deleteButton.textContent = "DELETE";
        deleteButton.addEventListener("click", () => {
            deleteBorrower(borrower.id);
        });

        actions.append(
            paymentButton,
            historyButton,
            editButton,
            deleteButton
        );

        card.append(details, actions);
        list.appendChild(card);
    });
}


// OPEN BORROWER FORM
function openBorrowerForm() {
    editingBorrowerId = null;

    document.getElementById("borrowerFormTitle").textContent =
        "Add New Borrower";

    document.getElementById("borrowerName").value = "";
    document.getElementById("borrowerRelationship").value = "";
    document.getElementById("borrowerDate").value =
        new Date().toISOString().slice(0, 10);
    document.getElementById("borrowerAmount").value = "";
    document.getElementById("borrowerPurpose").value = "";
    document.getElementById("borrowerDueDate").value = "";
    document.getElementById("borrowerContact").value = "";

    document.getElementById("borrowerAmount").disabled = false;

    document.getElementById("borrowerWarning").style.display = "none";
    document.getElementById("borrowerFormContainer").style.display = "block";

    document.getElementById("borrowerFormContainer").scrollIntoView({
        behavior: "smooth",
        block: "start"
    });
}


// CLOSE BORROWER FORM
function closeBorrowerForm() {
    document.getElementById("borrowerFormContainer").style.display = "none";
    editingBorrowerId = null;
}


// SAVE OR UPDATE BORROWER
function saveBorrower() {
    const name = document.getElementById("borrowerName").value.trim();
    const relationship =
        document.getElementById("borrowerRelationship").value;
    const date = document.getElementById("borrowerDate").value;
    const amountInput = document.getElementById("borrowerAmount");
    const amount = Number(amountInput.value);
    const purpose = document.getElementById("borrowerPurpose").value.trim();
    const dueDate = document.getElementById("borrowerDueDate").value;
    const contact = document.getElementById("borrowerContact").value.trim();

    if (!name || !relationship || !date || !purpose) {
        showMessage("Please complete all required borrower details.");
        return;
    }

    if (
        !editingBorrowerId &&
        (amountInput.value.trim() === "" ||
            !Number.isFinite(amount) ||
            amount <= 0)
    ) {
        showMessage("Please enter a valid amount borrowed.");
        return;
    }

    if (editingBorrowerId) {
        const existing = receivableRecords.find(
            borrower => borrower.id === editingBorrowerId
        );

        if (!existing) return;

        existing.name = name;
        existing.relationship = relationship;
        existing.date = date;
        existing.purpose = purpose;
        existing.dueDate = dueDate;
        existing.contact = contact;

        // Original loan amount is kept unchanged to protect cash-flow history.

        showMessage("Borrower details updated.");
    } else {
        const previous = getBorrowerAssessment(name, contact);

        const borrower = {
            id: Date.now().toString(),
            name,
            relationship,
            date,
            amount,
            purpose,
            dueDate,
            contact,
            payments: [],
            assessment: previous ? "Previously Irresponsible" : ""
        };

        receivableRecords.push(borrower);

        if (previous) {
            showMessage(
                "Warning: This borrower has a previous irresponsible assessment."
            );
        } else {
            showMessage("Borrower record saved successfully.");
        }
    }

    saveReceivables();
    closeBorrowerForm();
    renderReceivables();
    updateIncomeDashboard();
}


// EDIT BORROWER
function editBorrower(id) {
    const borrower = receivableRecords.find(
        item => item.id === id
    );

    if (!borrower) return;

    editingBorrowerId = id;

    document.getElementById("borrowerFormTitle").textContent =
        "Edit Borrower Details";

    document.getElementById("borrowerName").value = borrower.name;
    document.getElementById("borrowerRelationship").value =
        borrower.relationship;
    document.getElementById("borrowerDate").value = borrower.date;
    document.getElementById("borrowerAmount").value = borrower.amount;
    document.getElementById("borrowerAmount").disabled = true;
    document.getElementById("borrowerPurpose").value = borrower.purpose;
    document.getElementById("borrowerDueDate").value =
        borrower.dueDate || "";
    document.getElementById("borrowerContact").value =
        borrower.contact || "";

    document.getElementById("borrowerFormContainer").style.display = "block";

    checkBorrowerWarning();

    document.getElementById("borrowerFormContainer").scrollIntoView({
        behavior: "smooth",
        block: "start"
    });
}


// DELETE BORROWER
function deleteBorrower(id) {
    const borrower = receivableRecords.find(
        item => item.id === id
    );

    if (!borrower) return;

    if ((borrower.payments || []).length > 0) {
        showMessage(
            "This borrower has payment records. Use Archive & Clear to preserve the complete history."
        );
        return;
    }

    if (!confirm(
        "Delete this borrower record? This action cannot be undone."
    )) return;

    receivableRecords = receivableRecords.filter(
        item => item.id !== id
    );

    saveReceivables();
    renderReceivables();
    updateIncomeDashboard();

    showMessage("Borrower record deleted.");
}


// OPEN PAYMENT FORM
function openBorrowerPayment(id) {
    const borrower = receivableRecords.find(
        item => item.id === id
    );

    if (!borrower) return;

    selectedPaymentBorrowerId = id;

    document.getElementById("paymentBorrowerName").textContent =
        borrower.name;

    document.getElementById("paymentOriginalAmount").textContent =
        receivableMoney(borrower.amount);

    document.getElementById("paymentPreviouslyPaid").textContent =
        receivableMoney(getBorrowerPaid(borrower));

    document.getElementById("paymentOutstanding").textContent =
        receivableMoney(getBorrowerOutstanding(borrower));

    document.getElementById("borrowerPaymentDate").value =
        new Date().toISOString().slice(0, 10);

    document.getElementById("borrowerPaymentAmount").value = "";
    document.getElementById("borrowerPaymentRemarks").value = "";

    document.getElementById("borrowerPaymentContainer").style.display =
        "block";

    document.getElementById("borrowerHistoryContainer").style.display =
        "none";

    document.getElementById("borrowerPaymentContainer").scrollIntoView({
        behavior: "smooth",
        block: "start"
    });
}


// CLOSE PAYMENT FORM
function closeBorrowerPayment() {
    document.getElementById("borrowerPaymentContainer").style.display =
        "none";

    selectedPaymentBorrowerId = null;
}


// SAVE FULL OR PARTIAL PAYMENT
function saveBorrowerPayment() {
    const borrower = receivableRecords.find(
        item => item.id === selectedPaymentBorrowerId
    );

    if (!borrower) return;

    const date = document.getElementById("borrowerPaymentDate").value;
    const amountInput = document.getElementById("borrowerPaymentAmount");
    const amount = Number(amountInput.value);
    const remarks =
        document.getElementById("borrowerPaymentRemarks").value.trim();

    const outstanding = getBorrowerOutstanding(borrower);

    if (!date || amountInput.value.trim() === "" ||
        !Number.isFinite(amount) || amount <= 0) {
        showMessage("Enter a valid payment date and amount.");
        return;
    }

    if (amount > outstanding) {
        showMessage(
            "Payment exceeds the outstanding balance of " +
            receivableMoney(outstanding) + "."
        );
        return;
    }

    borrower.payments = borrower.payments || [];

const paymentId = Date.now().toString();

borrower.payments.push({
    id: paymentId,
    date,
    amount,
    remarks
});

// AUTOMATICALLY RECORD COLLECTION IN INCOME MANAGEMENT
incomeRecords.push({
    id: "utang-" + paymentId,
    date: date,
    source: "Utang Collection",
    description: "Payment collected from " + borrower.name,
    amount: amount,
    remarks: remarks || "Recorded through Debt Manager",
    receivablePaymentId: paymentId
});

saveIncomeRecords();

    const fullyPaid = getBorrowerOutstanding(borrower) <= 0;

    if (fullyPaid && !borrower.assessment) {
        const responsible = confirm(
            borrower.name + " has fully repaid the loan.\n\n" +
            "Select OK if this borrower was RESPONSIBLE.\n" +
            "Select Cancel if this borrower was IRRESPONSIBLE."
        );

        borrower.assessment = responsible
            ? "Responsible"
            : "Irresponsible";
    }

    saveReceivables();
    closeBorrowerPayment();
    renderReceivables();
    updateIncomeDashboard();

    showMessage(
        fullyPaid
            ? "Full payment recorded. Borrower assessment saved."
            : "Partial payment recorded successfully."
    );
}


// OPEN BORROWER PAYMENT HISTORY
function openBorrowerHistory(id) {
    const borrower = receivableRecords.find(
        item => item.id === id
    );

    if (!borrower) return;

    selectedHistoryBorrowerId = id;

    document.getElementById("historyBorrowerName").textContent =
        borrower.name;

    const container =
        document.getElementById("borrowerPaymentHistory");

    container.innerHTML = "";

    if (!borrower.payments || borrower.payments.length === 0) {
        container.textContent = "No payments recorded yet.";
    } else {
        borrower.payments.forEach(payment => {
            const row = document.createElement("p");

            row.textContent =
                payment.date + " — " +
                receivableMoney(payment.amount) +
                (payment.remarks ? " — " + payment.remarks : "");

            container.appendChild(row);
        });
    }

    const total = document.createElement("strong");
    total.textContent =
        "Total Collected: " + receivableMoney(getBorrowerPaid(borrower));

    const balance = document.createElement("strong");
    balance.textContent =
        "Outstanding: " + receivableMoney(getBorrowerOutstanding(borrower));

    container.append(total, balance);

    document.getElementById("borrowerPaymentContainer").style.display =
        "none";

    document.getElementById("borrowerHistoryContainer").style.display =
        "block";

    document.getElementById("borrowerHistoryContainer").scrollIntoView({
        behavior: "smooth",
        block: "start"
    });
}


// CLOSE PAYMENT HISTORY
function closeBorrowerHistory() {
    document.getElementById("borrowerHistoryContainer").style.display =
        "none";

    selectedHistoryBorrowerId = null;
}


// ARCHIVE AND CLEAR ACTIVE RECEIVABLES
function archiveAndClearReceivables() {
    if (receivableRecords.length === 0) {
        showMessage("There are no active borrower records to archive.");
        return;
    }

    const confirmed = confirm(
        "ARCHIVE AND CLEAR RECEIVABLES?\n\n" +
        "All active borrower records, payment histories, outstanding " +
        "balances and borrower assessments will be transferred to " +
        "Transaction History.\n\n" +
        "Archived records will be preserved.\n\n" +
        "Continue?"
    );

    if (!confirmed) return;

    const archiveBatch = {
        id: "ARCH-" + Date.now(),
        archivedAt: new Date().toISOString(),
        records: receivableRecords.map(borrower => ({
            ...borrower,
            payments: (borrower.payments || []).map(
                payment => ({ ...payment })
            )
        }))
    };

    receivablesArchive.push(archiveBatch);
    saveReceivablesArchive();

    receivableRecords = [];
    saveReceivables();

    closeBorrowerForm();
    closeBorrowerPayment();
    closeBorrowerHistory();

    renderReceivables();
    renderReceivablesArchive();
    updateIncomeDashboard();

    showMessage("Receivables archived. Transaction history is preserved.");
}


// SHOW OR HIDE ARCHIVED TRANSACTIONS
function toggleReceivablesArchive() {
    const container =
        document.getElementById("receivablesArchiveContainer");

    const button =
        document.getElementById("toggleReceivablesArchive");

    if (!container || !button) return;

    const isHidden = container.style.display === "none";

    container.style.display = isHidden ? "block" : "none";

    button.textContent = isHidden
        ? "📁 Hide Archived Transactions"
        : "📁 View Archived Transactions";

    if (isHidden) {
        renderReceivablesArchive();
    }
}


// DISPLAY ARCHIVED TRANSACTIONS
function renderReceivablesArchive() {
    const list = document.getElementById("receivablesArchiveList");

    if (!list) return;

    list.innerHTML = "";

    if (receivablesArchive.length === 0) {
        list.innerHTML =
            '<div class="empty-state">No archived transactions yet.</div>';
        return;
    }

    [...receivablesArchive].reverse().forEach(batch => {
        const batchCard = document.createElement("div");
        batchCard.className = "receivables-archive-batch";

        const date = new Date(batch.archivedAt).toLocaleDateString(
            "en-PH",
            { month: "long", day: "numeric", year: "numeric" }
        );

        const heading = document.createElement("h4");
        heading.textContent = "Archived on " + date;
        batchCard.appendChild(heading);

        (batch.records || []).forEach(borrower => {
            const card = document.createElement("div");
            card.className = "receivable-borrower-card";

            const details = document.createElement("div");

            const fields = [
                ["Borrower", borrower.name],
                ["Relationship", borrower.relationship],
                ["Date Borrowed", borrower.date],
                ["Purpose", borrower.purpose],
                ["Contact", borrower.contact || "Not provided"],
                ["Original Amount", receivableMoney(borrower.amount)],
                ["Total Collected", receivableMoney(getBorrowerPaid(borrower))],
                ["Outstanding at Archive", receivableMoney(getBorrowerOutstanding(borrower))],
                ["Status at Archive", getBorrowerStatus(borrower)],
                ["Borrower Assessment", borrower.assessment || "Not assessed"]
            ];

            fields.forEach(([label, value]) => {
                const line = document.createElement("p");
                line.textContent = label + ": " + value;
                details.appendChild(line);
            });

            const paymentHistory = document.createElement("div");
            paymentHistory.className = "receivables-archive-payments";

            const paymentHeading = document.createElement("strong");
            paymentHeading.textContent = "Payment History";
            paymentHistory.appendChild(paymentHeading);

            if (!borrower.payments || borrower.payments.length === 0) {
                const empty = document.createElement("p");
                empty.textContent = "No payments recorded.";
                paymentHistory.appendChild(empty);
            } else {
                borrower.payments.forEach(payment => {
                    const row = document.createElement("p");
                    row.textContent =
                        payment.date + " — " +
                        receivableMoney(payment.amount) +
                        (payment.remarks ? " — " + payment.remarks : "");

                    paymentHistory.appendChild(row);
                });
            }

            card.append(details, paymentHistory);
            batchCard.appendChild(card);
        });

        list.appendChild(batchCard);
    });
}


// CALCULATE NET CASH FLOW FROM ALL LOANS AND COLLECTIONS
// Lending reduces cash; collections increase cash.
// Archived records remain included so archiving does not change cash.
// CALCULATE NET CASH FLOW FROM ALL LOANS
// Collections are already included in Income Management.
// Therefore, only subtract the money originally lent.
// Archived records remain included.
function getReceivablesNetCashFlow() {

    let totalLent = 0;

    getAllReceivableBorrowers().forEach(borrower => {
        totalLent += Number(borrower.amount || 0);
    });

    return -totalLent;
}


// CONNECT RECEIVABLES BUTTONS
document.getElementById("addBorrowerButton")
    .addEventListener("click", openBorrowerForm);

document.getElementById("saveBorrowerButton")
    .addEventListener("click", saveBorrower);

document.getElementById("cancelBorrowerButton")
    .addEventListener("click", closeBorrowerForm);

document.getElementById("borrowerName")
    .addEventListener("input", checkBorrowerWarning);

document.getElementById("borrowerContact")
    .addEventListener("input", checkBorrowerWarning);

document.getElementById("saveBorrowerPayment")
    .addEventListener("click", saveBorrowerPayment);

document.getElementById("cancelBorrowerPayment")
    .addEventListener("click", closeBorrowerPayment);

document.getElementById("closeBorrowerHistory")
    .addEventListener("click", closeBorrowerHistory);

document.getElementById("resetReceivables")
    .addEventListener("click", archiveAndClearReceivables);

document.getElementById("toggleReceivablesArchive")
    .addEventListener("click", toggleReceivablesArchive);


// INITIAL RECEIVABLES DISPLAY
renderReceivables();


// ========================================
// PAYABLES MANAGEMENT
// ========================================

const PAYABLES_STORAGE_KEY = "pesomate_payables_v1";
const PAYABLES_ARCHIVE_KEY = "pesomate_payables_archive_v1";

let payableRecords = [];
let payablesArchive = [];
let selectedCreditorId = null;
let selectedCreditorHistoryId = null;

try {
    payableRecords = JSON.parse(
        localStorage.getItem(PAYABLES_STORAGE_KEY) || "[]"
    );

    payablesArchive = JSON.parse(
        localStorage.getItem(PAYABLES_ARCHIVE_KEY) || "[]"
    );

    if (!Array.isArray(payableRecords)) payableRecords = [];
    if (!Array.isArray(payablesArchive)) payablesArchive = [];

} catch (error) {
    payableRecords = [];
    payablesArchive = [];
}


// SAVE RECORDS
function savePayables() {
    localStorage.setItem(
        PAYABLES_STORAGE_KEY,
        JSON.stringify(payableRecords)
    );
}

function savePayablesArchive() {
    localStorage.setItem(
        PAYABLES_ARCHIVE_KEY,
        JSON.stringify(payablesArchive)
    );
}


// MONEY FORMAT
function payableMoney(amount) {
    return "₱" + Number(amount || 0).toLocaleString("en-PH", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    });
}


// PAYMENT TOTAL
function getCreditorPaid(creditor) {
    return (creditor.payments || []).reduce(
        (total, payment) => total + Number(payment.amount || 0),
        0
    );
}


// OUTSTANDING BALANCE
function getCreditorOutstanding(creditor) {
    return Math.max(
        0,
        Number(creditor.amount || 0) - getCreditorPaid(creditor)
    );
}


// PAYMENT STATUS
function getCreditorStatus(creditor) {

    const outstanding = getCreditorOutstanding(creditor);

    if (outstanding <= 0) return "Fully Paid";

    if (getCreditorPaid(creditor) > 0) return "Partially Paid";

    return "Unpaid";
}


// OVERDUE CHECK
function isCreditorOverdue(creditor) {

    if (!creditor.dueDate) return false;

    if (getCreditorOutstanding(creditor) <= 0) return false;

    const today = new Date().toLocaleDateString("en-CA");

    return creditor.dueDate < today;
}


// OPEN FORM
function openCreditorForm() {

    document.getElementById("creditorFormTitle").textContent =
        "Add New Debt";

    document.getElementById("creditorName").value = "";
    document.getElementById("creditorRelationship").value = "";
    document.getElementById("creditorDate").value =
        new Date().toLocaleDateString("en-CA");

    document.getElementById("creditorAmount").value = "";
    document.getElementById("creditorPurpose").value = "";
    document.getElementById("creditorDueDate").value = "";
    document.getElementById("creditorContact").value = "";

    document.getElementById("creditorFormContainer").style.display =
        "block";

    document.getElementById("creditorPaymentContainer").style.display =
        "none";

    document.getElementById("creditorHistoryContainer").style.display =
        "none";
}


// CLOSE FORM
function closeCreditorForm() {
    document.getElementById("creditorFormContainer").style.display =
        "none";
}


// SAVE NEW DEBT
function saveCreditor() {

    const name = document.getElementById("creditorName").value.trim();
    const relationship =
        document.getElementById("creditorRelationship").value;

    const date = document.getElementById("creditorDate").value;
    const amount = Number(
        document.getElementById("creditorAmount").value
    );

    const purpose =
        document.getElementById("creditorPurpose").value.trim();

    const dueDate =
        document.getElementById("creditorDueDate").value;

    const contact =
        document.getElementById("creditorContact").value.trim();

    if (
        !name ||
        !relationship ||
        !date ||
        !purpose ||
        !Number.isFinite(amount) ||
        amount <= 0
    ) {
        showMessage("Please complete all required fields.");
        return;
    }

    payableRecords.push({
        id: Date.now().toString(),
        name,
        relationship,
        date,
        amount,
        purpose,
        dueDate,
        contact,
        payments: []
    });

    savePayables();
    closeCreditorForm();
    renderPayables();

    showMessage("Debt record saved successfully.");
}


// DISPLAY DEBT RECORDS
function renderPayables() {

    const list = document.getElementById("payablesList");

    if (!list) return;

    list.innerHTML = "";

    let totalOutstanding = 0;
    let totalRepaid = 0;

    let unpaid = 0;
    let partial = 0;
    let paid = 0;

    payableRecords.forEach(creditor => {

        const outstanding = getCreditorOutstanding(creditor);
        const repaid = getCreditorPaid(creditor);
        const status = getCreditorStatus(creditor);

        totalOutstanding += outstanding;
        totalRepaid += repaid;

        if (status === "Unpaid") unpaid++;
        if (status === "Partially Paid") partial++;
        if (status === "Fully Paid") paid++;

        const card = document.createElement("div");
        card.className = "payable-creditor-card";

        const heading = document.createElement("div");
        heading.className = "payable-card-heading";

        const name = document.createElement("strong");
        name.textContent = creditor.name;

        const amount = document.createElement("strong");
        amount.textContent = payableMoney(outstanding);

        heading.append(name, amount);

        const details = document.createElement("div");
        details.className = "payable-card-details";

        const fields = [
            "Type: " + creditor.relationship,
            "Date Borrowed: " + creditor.date,
            "Purpose: " + creditor.purpose,
            "Original Amount: " + payableMoney(creditor.amount),
            "Total Repaid: " + payableMoney(repaid),
            "Outstanding: " + payableMoney(outstanding),
            "Status: " + status
        ];

        if (creditor.dueDate) {
            fields.push("Due Date: " + creditor.dueDate);
        }

        if (creditor.contact) {
            fields.push("Contact: " + creditor.contact);
        }

        if (isCreditorOverdue(creditor)) {
            fields.push("⚠ OVERDUE");
        }

        fields.forEach(text => {
            const line = document.createElement("p");
            line.textContent = text;
            details.appendChild(line);
        });

        const actions = document.createElement("div");
        actions.className = "payable-card-actions";

        if (outstanding > 0) {

            const paymentButton = document.createElement("button");
            paymentButton.textContent = "RECORD REPAYMENT";

            paymentButton.addEventListener("click", () => {
                openCreditorPayment(creditor.id);
            });

            actions.appendChild(paymentButton);
        }

const historyButton = document.createElement("button");
historyButton.type = "button";
historyButton.textContent = "PAYMENT HISTORY";

historyButton.addEventListener("click", () => {
    openCreditorHistory(creditor.id);
});

        actions.appendChild(historyButton);

        card.append(heading, details, actions);
        list.appendChild(card);
    });


    if (payableRecords.length === 0) {
        list.innerHTML =
            '<div class="empty-state">No debt records yet.</div>';
    }


    document.getElementById("payablesOutstanding").textContent =
        payableMoney(totalOutstanding);

    document.getElementById("payablesTotalRepaid").textContent =
        payableMoney(totalRepaid);

    document.getElementById("payablesUnpaidCount").textContent = unpaid;

    document.getElementById("payablesPartialCount").textContent = partial;

    document.getElementById("payablesPaidCount").textContent = paid;
}


// OPEN REPAYMENT FORM
function openCreditorPayment(id) {

    const creditor = payableRecords.find(item => item.id === id);

    if (!creditor) return;

    selectedCreditorId = id;

    document.getElementById("paymentCreditorName").textContent =
        creditor.name;

    document.getElementById("paymentCreditorOriginal").textContent =
        payableMoney(creditor.amount);

    document.getElementById("paymentCreditorPreviouslyPaid").textContent =
        payableMoney(getCreditorPaid(creditor));

    document.getElementById("paymentCreditorOutstanding").textContent =
        payableMoney(getCreditorOutstanding(creditor));

    document.getElementById("creditorPaymentDate").value =
        new Date().toLocaleDateString("en-CA");

    document.getElementById("creditorPaymentAmount").value = "";
    document.getElementById("creditorPaymentRemarks").value = "";

    document.getElementById("creditorFormContainer").style.display =
        "none";

    document.getElementById("creditorHistoryContainer").style.display =
        "none";

    document.getElementById("creditorPaymentContainer").style.display =
        "flex";
}


// CLOSE REPAYMENT FORM
function closeCreditorPayment() {

    document.getElementById("creditorPaymentContainer").style.display =
        "none";

    selectedCreditorId = null;
}


// SAVE REPAYMENT
function saveCreditorPayment() {

    const creditor = payableRecords.find(
        item => item.id === selectedCreditorId
    );

    if (!creditor) return;

    const date =
        document.getElementById("creditorPaymentDate").value;

    const amount = Number(
        document.getElementById("creditorPaymentAmount").value
    );

    const remarks =
        document.getElementById("creditorPaymentRemarks").value.trim();

    const outstanding = getCreditorOutstanding(creditor);

    if (
        !date ||
        !Number.isFinite(amount) ||
        amount <= 0
    ) {
        showMessage("Please enter a valid payment date and amount.");
        return;
    }

    if (amount > outstanding) {
        showMessage(
            "Payment cannot exceed the outstanding balance of " +
            payableMoney(outstanding)
        );
        return;
    }

    creditor.payments.push({
        id: Date.now().toString(),
        date,
        amount,
        remarks
    });

    savePayables();

    closeCreditorPayment();
    renderPayables();

    showMessage(
        "Repayment recorded. Please record the actual payment separately in Expense Management."
    );
}


// VIEW REPAYMENT HISTORY
function openCreditorHistory(id) {

    const creditor = payableRecords.find(item => item.id === id);

    if (!creditor) return;

    selectedCreditorHistoryId = id;

    const payments = creditor.payments || [];
    const totalRepaid = getCreditorPaid(creditor);

    document.getElementById("historyCreditorName").textContent =
        creditor.name;

    // PAYMENT SUMMARY
    document.getElementById("payablesHistorySummary").innerHTML = `
        <div class="payables-history-summary-card">
            <small>TOTAL AMOUNT REPAID</small>
            <strong>${payableMoney(totalRepaid)}</strong>
            <span>${payments.length} repayment(s) recorded</span>
        </div>
    `;

    // PAYMENT RECORDS
    const container =
        document.getElementById("creditorPaymentHistory");

    container.innerHTML = "";

    if (payments.length === 0) {

        container.innerHTML = `
            <div class="payables-history-empty">
                <span>📭</span>
                <strong>No repayment records yet</strong>
                <small>Your repayment transactions will appear here.</small>
            </div>
        `;

    } else {

        [...payments].reverse().forEach(payment => {

            const row = document.createElement("div");
            row.className = "payable-payment-history-row";

            const details = document.createElement("div");
            details.className = "payables-history-payment-details";

            const date = document.createElement("strong");
            date.textContent = payment.date;

            const remarks = document.createElement("small");
            remarks.textContent = payment.remarks || "No remarks";

            const amount = document.createElement("strong");
            amount.className = "payables-history-payment-amount";
            amount.textContent = payableMoney(payment.amount);

            details.append(date, remarks);
            row.append(details, amount);

            container.appendChild(row);
        });
    }

    document.getElementById("creditorPaymentContainer").style.display =
        "none";

    document.getElementById("creditorHistoryContainer").style.display =
        "flex";
}


// CLOSE HISTORY
function closeCreditorHistory() {

    document.getElementById("creditorHistoryContainer").style.display =
        "none";

    selectedCreditorHistoryId = null;
}


// ARCHIVE AND CLEAR
function archiveAndClearPayables() {

    if (payableRecords.length === 0) {
        showMessage("There are no active debt records to archive.");
        return;
    }

    if (!confirm(
        "ARCHIVE AND CLEAR PAYABLES?\n\n" +
        "All active debt records and repayment histories will be " +
        "transferred to Transaction History.\n\nContinue?"
    )) {
        return;
    }

    const archiveBatch = {
        id: "PAYABLE-ARCH-" + Date.now(),
        archivedAt: new Date().toISOString(),
        records: payableRecords.map(creditor => ({
            ...creditor,
            payments: (creditor.payments || []).map(
                payment => ({ ...payment })
            )
        }))
    };

    payablesArchive.push(archiveBatch);

    savePayablesArchive();

    payableRecords = [];

    savePayables();

    closeCreditorForm();
    closeCreditorPayment();
    closeCreditorHistory();

    renderPayables();
    renderPayablesArchive();

    showMessage("Payables archived successfully.");
}


// SHOW / HIDE ARCHIVE
function togglePayablesArchive() {

    const container =
        document.getElementById("payablesArchiveContainer");

    const button =
        document.getElementById("togglePayablesArchive");

    const isHidden = container.style.display === "none";

    container.style.display = isHidden ? "block" : "none";

    button.textContent = isHidden
        ? "📁 HIDE ARCHIVED TRANSACTIONS"
        : "VIEW ARCHIVED TRANSACTIONS";

    if (isHidden) renderPayablesArchive();
}


// DISPLAY ARCHIVE
function renderPayablesArchive() {

    const list = document.getElementById("payablesArchiveList");

    if (!list) return;

    list.innerHTML = "";

    if (payablesArchive.length === 0) {
        list.innerHTML =
            '<div class="empty-state">No archived debt records yet.</div>';
        return;
    }

    [...payablesArchive].reverse().forEach(batch => {

        const batchCard = document.createElement("div");
        batchCard.className = "payables-archive-batch";

        const heading = document.createElement("h4");

        heading.textContent =
            "Archived on " +
            new Date(batch.archivedAt).toLocaleDateString("en-PH");

        batchCard.appendChild(heading);

        (batch.records || []).forEach(creditor => {

            const card = document.createElement("div");
            card.className = "payable-creditor-card";

            const details = document.createElement("div");

            const fields = [
                ["Creditor", creditor.name],
                ["Relationship / Type", creditor.relationship],
                ["Date Borrowed", creditor.date],
                ["Purpose", creditor.purpose],
                ["Contact", creditor.contact || "Not provided"],
                ["Original Amount", payableMoney(creditor.amount)],
                ["Total Repaid", payableMoney(getCreditorPaid(creditor))],
                ["Outstanding at Archive", payableMoney(getCreditorOutstanding(creditor))],
                ["Status at Archive", getCreditorStatus(creditor)]
            ];

            fields.forEach(([label, value]) => {

                const line = document.createElement("p");
                line.textContent = label + ": " + value;

                details.appendChild(line);
            });

            const history = document.createElement("div");

            const historyTitle = document.createElement("strong");
            historyTitle.textContent = "Repayment History";

            history.appendChild(historyTitle);

            if (!creditor.payments || creditor.payments.length === 0) {

                const empty = document.createElement("p");
                empty.textContent = "No repayments recorded.";

                history.appendChild(empty);

            } else {

                creditor.payments.forEach(payment => {

                    const row = document.createElement("p");

                    row.textContent =
                        payment.date + " — " +
                        payableMoney(payment.amount) +
                        (payment.remarks ? " — " + payment.remarks : "");

                    history.appendChild(row);
                });
            }

            card.append(details, history);
            batchCard.appendChild(card);
        });

        list.appendChild(batchCard);
    });
}


// CONNECT PAYABLES BUTTONS
document.getElementById("addCreditorButton")
    .addEventListener("click", openCreditorForm);

document.getElementById("saveCreditorButton")
    .addEventListener("click", saveCreditor);

document.getElementById("cancelCreditorButton")
    .addEventListener("click", closeCreditorForm);

document.getElementById("saveCreditorPayment")
    .addEventListener("click", saveCreditorPayment);

document.getElementById("cancelCreditorPayment")
    .addEventListener("click", closeCreditorPayment);

document.getElementById("closeCreditorHistory")
    .addEventListener("click", closeCreditorHistory);

document.getElementById("resetPayables")
    .addEventListener("click", archiveAndClearPayables);

document.getElementById("togglePayablesArchive")
    .addEventListener("click", togglePayablesArchive);


// INITIAL PAYABLES DISPLAY
renderPayables();

// ========================================
// INITIALIZE APPLICATION
// ========================================

displayDate();
renderMoneyJar();
renderIncomeRecords();
renderExpenseRecords();
renderMoneyJar();

if ("serviceWorker" in navigator) {

    window.addEventListener("load", () => {

        navigator.serviceWorker.register("./service-worker.js")
            .catch(error => {
                console.error("Service Worker registration failed:", error);
            });

    });

}
// ========================================
// PESOMATE - BILLS & REMINDERS
// ========================================

const BILLS_STORAGE_KEY = "pesomate_bills_v1";

let bills = [];

try {
    bills = JSON.parse(
        localStorage.getItem(BILLS_STORAGE_KEY) || "[]"
    );

    if (!Array.isArray(bills)) bills = [];

} catch (error) {
    bills = [];
}

let editingBillId = null;


// SAVE BILLS
function saveBills() {
    localStorage.setItem(
        BILLS_STORAGE_KEY,
        JSON.stringify(bills)
    );
}


// TODAY'S DATE
function getBillToday() {
    const date = new Date();

    return [
        date.getFullYear(),
        String(date.getMonth() + 1).padStart(2, "0"),
        String(date.getDate()).padStart(2, "0")
    ].join("-");
}


// FORMAT DATE
function formatBillDate(date) {
    if (!date) return "";

    return new Date(date + "T00:00:00")
        .toLocaleDateString("en-PH", {
            day: "2-digit",
            month: "short",
            year: "numeric"
        });
}


// DETERMINE BILL STATUS
function getBillStatus(bill) {

    if (bill.paid) return "Paid";

    const today = getBillToday();

    if (bill.dueDate < today) return "Overdue";

    if (bill.dueDate === today) return "Due Today";

    return "Upcoming";
}


// UPDATE AVAILABLE FUND
function updateBillsNecessities() {

    const element = document.getElementById(
        "billsNecessitiesAvailable"
    );

    if (element) {
        element.textContent = money(getAvailableNecessities());
    }
}


// DISPLAY BILLS
function renderBills() {

    const list = document.getElementById("billsList");

    if (!list) return;

    const filter = document.getElementById(
        "billStatusFilter"
    ).value;

    const unpaid = bills.filter(bill => !bill.paid);

    const outstanding = unpaid.reduce(
        (sum, bill) => sum + Number(bill.amount),
        0
    );

    document.getElementById("totalOutstanding").textContent =
        money(outstanding);

    document.getElementById("upcomingBillsCount").textContent =
        unpaid.filter(bill => getBillStatus(bill) === "Upcoming").length;

    document.getElementById("overdueBillsCount").textContent =
        unpaid.filter(bill => getBillStatus(bill) === "Overdue").length;

    document.getElementById("paidBillsCount").textContent =
        bills.filter(bill => bill.paid).length;

    updateBillsNecessities();

    const filtered = bills
        .filter(bill => {
            const status = getBillStatus(bill);

            if (filter === "All") return true;

            if (filter === "Unpaid") return !bill.paid;

            return status === filter;
        })
        .sort((a, b) => a.dueDate.localeCompare(b.dueDate));

    list.innerHTML = "";

    if (filtered.length === 0) {
        list.innerHTML =
            '<div class="bills-empty">No bills found.</div>';
        return;
    }

    filtered.forEach(bill => {

        const status = getBillStatus(bill);

        const card = document.createElement("div");
        card.className = "bill-card";

        const details = document.createElement("div");
        details.className = "bill-card-details";

        const name = document.createElement("strong");
        name.textContent = bill.name;

        const info = document.createElement("small");
        info.textContent =
            bill.category + " • Due " + formatBillDate(bill.dueDate);

        const frequency = document.createElement("small");
        frequency.textContent = bill.frequency;

        details.append(name, info, frequency);

        const right = document.createElement("div");
        right.className = "bill-card-right";

        const amount = document.createElement("strong");
        amount.textContent = money(bill.amount);

        const badge = document.createElement("span");
        badge.className =
            "bill-status " + status.toLowerCase().replaceAll(" ", "-");

        badge.textContent = status;

        right.append(amount, badge);

        const actions = document.createElement("div");
        actions.className = "bill-card-actions";

        if (!bill.paid) {

            const edit = document.createElement("button");
            edit.type = "button";
            edit.textContent = "EDIT";
            edit.addEventListener("click", () => editBill(bill.id));

            const pay = document.createElement("button");
            pay.type = "button";
            pay.textContent = "MARK PAID";
            pay.className = "bill-pay-button";
            pay.addEventListener("click", () => markBillPaid(bill.id));

            const remove = document.createElement("button");
            remove.type = "button";
            remove.textContent = "DELETE";
            remove.addEventListener("click", () => deleteBill(bill.id));

            actions.append(edit, pay, remove);

        } else {

            const undo = document.createElement("button");
            undo.type = "button";
            undo.textContent = "UNDO PAYMENT";
            undo.className = "bill-undo-button";

            undo.addEventListener("click", () => undoBillPayment(bill.id));

            actions.appendChild(undo);
        }

        card.append(details, right, actions);
        list.appendChild(card);
    });
}


// OPEN ADD BILL POPUP
function openBillForm() {

    editingBillId = null;

    document.getElementById("billFormTitle").textContent =
        "Add New Bill";

    document.getElementById("billName").value = "";
    document.getElementById("billCategory").value = "Utilities";
    document.getElementById("billAmount").value = "";
    document.getElementById("billDueDate").value = getBillToday();
    document.getElementById("billFrequency").value = "One-time";
    document.getElementById("billRemarks").value = "";

    document.getElementById("billFormContainer").style.display =
        "block";

    document.body.style.overflow = "hidden";
}


// CLOSE POPUP
function closeBillForm() {

    document.getElementById("billFormContainer").style.display =
        "none";

    document.body.style.overflow = "";

    editingBillId = null;
}


// EDIT BILL
function editBill(id) {

    const bill = bills.find(item => item.id === id);

    if (!bill || bill.paid) return;

    editingBillId = id;

    document.getElementById("billFormTitle").textContent =
        "Edit Bill";

    document.getElementById("billName").value = bill.name;
    document.getElementById("billCategory").value = bill.category;
    document.getElementById("billAmount").value = bill.amount;
    document.getElementById("billDueDate").value = bill.dueDate;
    document.getElementById("billFrequency").value = bill.frequency;
    document.getElementById("billRemarks").value = bill.remarks || "";

    document.getElementById("billFormContainer").style.display =
        "block";

    document.body.style.overflow = "hidden";
}


// SAVE BILL
function saveBill() {

    const name = document.getElementById("billName").value.trim();
    const category = document.getElementById("billCategory").value;
    const amount = Number(document.getElementById("billAmount").value);
    const dueDate = document.getElementById("billDueDate").value;
    const frequency = document.getElementById("billFrequency").value;
    const remarks = document.getElementById("billRemarks").value.trim();

    if (!name || !dueDate || !Number.isFinite(amount) || amount <= 0) {
        showMessage("Please enter a bill name, valid amount and due date.");
        return;
    }

    const billData = {
        name,
        category,
        amount,
        dueDate,
        frequency,
        remarks
    };

    if (editingBillId !== null) {

        bills = bills.map(bill =>
            bill.id === editingBillId
                ? { ...bill, ...billData }
                : bill
        );

        showMessage("Bill updated successfully.");

    } else {

        bills.push({
            id: Date.now().toString(),
            ...billData,
            paid: false,
            paymentDate: null,
            expenseId: null
        });

        showMessage("Bill added successfully.");
    }

    saveBills();
    closeBillForm();
    renderBills();
}


// MARK BILL AS PAID
function markBillPaid(id) {

    const bill = bills.find(item => item.id === id);

    if (!bill || bill.paid) return;

    const available = getAvailableNecessities();

    if (bill.amount > available) {
        showMessage(
            "Insufficient Necessities Fund. Available: " +
            money(available)
        );
        return;
    }

    if (!confirm(
        "Confirm payment of " + bill.name +
        " for " + money(bill.amount) +
        "? This will create an expense record."
    )) return;

    const paymentDate = getBillToday();

    const expenseId = "bill-" + bill.id;

    expenseRecords.push({
        id: expenseId,
        date: paymentDate,
        category: bill.category,
        description: bill.name,
        amount: Number(bill.amount),
        paymentMethod: "Cash",
        remarks: "Automatically recorded from Bills & Reminders."
    });

    bill.paid = true;
    bill.paymentDate = paymentDate;
    bill.expenseId = expenseId;

    saveBills();
    saveExpenseRecords();

    renderBills();
    renderExpenseRecords();
    renderMoneyJar();

    showMessage("Payment recorded and expense added successfully.");
}


// UNDO PAYMENT
function undoBillPayment(id) {

    const bill = bills.find(item => item.id === id);

    if (!bill || !bill.paid) return;

    if (!confirm(
        "Undo this payment? The linked expense record will also be reversed."
    )) return;

    expenseRecords = expenseRecords.filter(
        expense => expense.id !== bill.expenseId
    );

    bill.paid = false;
    bill.paymentDate = null;
    bill.expenseId = null;

    saveBills();
    saveExpenseRecords();

    renderBills();
    renderExpenseRecords();
    renderMoneyJar();

    showMessage("Payment reversed successfully.");
}


// DELETE BILL
function deleteBill(id) {

    const bill = bills.find(item => item.id === id);

    if (!bill || bill.paid) return;

    if (!confirm("Are you sure you want to delete this bill?")) return;

    bills = bills.filter(item => item.id !== id);

    saveBills();
    renderBills();

    showMessage("Bill deleted successfully.");
}


// BUTTON CONNECTIONS
document.addEventListener("click", function(event) {

    // OPEN ADD BILL POPUP
    if (event.target.closest("#addBillButton")) {
        event.preventDefault();
        openBillForm();
    }

    // CLOSE USING CANCEL BUTTON
    if (event.target.closest("#cancelBillButton")) {
        event.preventDefault();
        closeBillForm();
    }

    // CLOSE USING X BUTTON
    if (event.target.closest("#closeBillButton")) {
        event.preventDefault();
        closeBillForm();
    }

    // SAVE BILL
    if (event.target.closest("#saveBillButton")) {
        event.preventDefault();
        saveBill();
    }

});

// FILTER CONNECTION
document.getElementById("billStatusFilter")
    .addEventListener("change", renderBills);

// INITIAL DISPLAY
renderBills();


// FILTER CONNECTION
document.getElementById("billStatusFilter")
    .addEventListener("change", renderBills);


// INITIAL DISPLAY
renderBills();
// ========================================
// RESET ALL BILLS
// ========================================

function resetAllBills() {

    if (bills.length === 0) {
        showMessage("There are no bills to reset.");
        return;
    }

    const confirmReset = confirm(
        "WARNING!\n\n" +
        "This will permanently delete ALL saved bills, " +
        "including paid and unpaid bills.\n\n" +
        "Your recorded expenses in Expense Management " +
        "will NOT be deleted.\n\n" +
        "Do you want to continue?"
    );

    if (!confirmReset) return;

    // Delete all bill entries only
    bills = [];

    // Save the empty bills list
    saveBills();

    // Close the bill form if open
    closeBillForm();

    // Refresh the Bills page
    renderBills();

    showMessage("All bills have been reset successfully.");
}


// RESET BUTTON CONNECTION
document.getElementById("resetAllBillsButton")
    .addEventListener("click", resetAllBills);
    // ========================================
// PESOMATE - BUDGET PLAN SIMULATOR
// Independent simulation - does not affect actual finances
// ========================================

const SIM_STORAGE_KEY = "pesomate_budget_simulator_v1";
const SIM_SCENARIO_KEY = "pesomate_budget_scenarios_v1";

let simData = {
    budget: 0,
    expenses: []
};

let simScenarios = [];
let simEditingId = null;

try {
    simData = JSON.parse(
        localStorage.getItem(SIM_STORAGE_KEY) ||
        '{"budget":0,"expenses":[]}'
    );

    if (!simData || !Array.isArray(simData.expenses)) {
        simData = { budget: 0, expenses: [] };
    }
} catch (error) {
    simData = { budget: 0, expenses: [] };
}

try {
    simScenarios = JSON.parse(
        localStorage.getItem(SIM_SCENARIO_KEY) || "[]"
    );

    if (!Array.isArray(simScenarios)) simScenarios = [];
} catch (error) {
    simScenarios = [];
}


// SAVE SIMULATOR DATA
function saveSimData() {
    localStorage.setItem(
        SIM_STORAGE_KEY,
        JSON.stringify(simData)
    );
}


// SAVE SCENARIOS
function saveSimScenarios() {
    localStorage.setItem(
        SIM_SCENARIO_KEY,
        JSON.stringify(simScenarios)
    );
}


// SAFE TEXT
function simEscape(value) {
    return String(value ?? "").replace(/[&<>"']/g, character => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;"
    })[character]);
}


// RENDER SIMULATOR
function renderBudgetSimulator() {

    const budgetInput = document.getElementById("simBudgetInput");

    if (!budgetInput) return;

    budgetInput.value = simData.budget || "";

    renderSimExpenses();
    renderSimSummary();
}


// CALCULATE SELECTED EXPENSES
function getSimSelectedTotal() {
    return simData.expenses
        .filter(item => item.selected)
        .reduce((sum, item) => sum + Number(item.amount), 0);
}


// RENDER EXPENSE LIST
function renderSimExpenses() {

    const list = document.getElementById("simExpenseList");
    const count = document.getElementById("simExpenseCount");

    if (!list) return;

    if (simData.expenses.length === 0) {
        list.innerHTML =
            '<p class="sim-empty">No planned expenses yet. Add your first expense.</p>';
    } else {

        list.innerHTML = simData.expenses.map(item => `
            <div class="sim-expense-row">

                <input type="checkbox"
                    class="sim-expense-check"
                    data-sim-check="${item.id}"
                    ${item.selected ? "checked" : ""}>

                <div class="sim-expense-info">
                    <strong>${simEscape(item.name)}</strong>
                    <small>${simEscape(item.type)}</small>
                </div>

                <strong class="sim-expense-amount">
                    ${money(Number(item.amount))}
                </strong>

                <div class="sim-row-actions">
                    <button type="button"
                        data-sim-edit="${item.id}"
                        aria-label="Edit expense">✎</button>

                    <button type="button"
                        data-sim-delete="${item.id}"
                        aria-label="Delete expense">×</button>
                </div>

            </div>
        `).join("");
    }

    if (count) {
        count.textContent =
            simData.expenses.length +
            (simData.expenses.length === 1 ? " expense" : " expenses");
    }
}


// RENDER SUMMARY
function renderSimSummary() {

    const budget = Number(simData.budget) || 0;
    const selectedTotal = getSimSelectedTotal();
    const remaining = budget - selectedTotal;

    const essential = simData.expenses
        .filter(item => item.selected && item.type === "Essential")
        .reduce((sum, item) => sum + Number(item.amount), 0);

    const nonEssential = simData.expenses
        .filter(item => item.selected && item.type === "Non-Essential")
        .reduce((sum, item) => sum + Number(item.amount), 0);

    document.getElementById("simBudgetLimit").textContent = money(budget);
    document.getElementById("simSelectedTotal").textContent = money(selectedTotal);
    document.getElementById("simRemaining").textContent = money(remaining);
    document.getElementById("simEssentialTotal").textContent = money(essential);
    document.getElementById("simNonEssentialTotal").textContent = money(nonEssential);

    const status = document.getElementById("simStatus");
    const progress = document.getElementById("simProgressFill");
    const progressText = document.getElementById("simProgressText");

    if (budget <= 0) {
        status.textContent = "SET YOUR BUDGET";
        status.className = "sim-status sim-status-neutral";
        progress.style.width = "0%";
        progressText.textContent = "Enter an available budget to begin.";
    } else if (selectedTotal <= budget) {
        status.textContent = "FEASIBLE";
        status.className = "sim-status sim-status-good";

        const percentage = Math.min((selectedTotal / budget) * 100, 100);

        progress.style.width = percentage + "%";
        progressText.textContent =
            percentage.toFixed(1) + "% of budget allocated";
    } else {
        status.textContent = "NOT FEASIBLE";
        status.className = "sim-status sim-status-bad";

        const percentage = (selectedTotal / budget) * 100;

        progress.style.width = "100%";
        progressText.textContent =
            "Over budget by " + money(Math.abs(remaining));
    }
}


// SET AVAILABLE BUDGET
document.getElementById("simSetBudget")
    .addEventListener("click", () => {

        const input = document.getElementById("simBudgetInput");
        const amount = Number(input.value);

        if (input.value.trim() === "" ||
            !Number.isFinite(amount) || amount <= 0) {

            showMessage("Please enter a valid available budget.");
            return;
        }

        simData.budget = amount;

        saveSimData();
        renderSimSummary();

        showMessage("Simulation budget updated.");
    });


// OPEN ADD EXPENSE FORM
document.getElementById("simAddExpense")
    .addEventListener("click", () => {

        simEditingId = null;

        document.getElementById("simExpenseName").value = "";
        document.getElementById("simExpenseAmount").value = "";
        document.getElementById("simExpenseType").value = "Essential";

        document.getElementById("simSaveExpense").textContent =
            "SAVE EXPENSE";

        document.getElementById("simExpenseForm").style.display = "block";
    });


// CANCEL EXPENSE FORM
document.getElementById("simCancelExpense")
    .addEventListener("click", () => {

        document.getElementById("simExpenseForm").style.display = "none";
        simEditingId = null;
    });


// SAVE OR UPDATE EXPENSE
document.getElementById("simSaveExpense")
    .addEventListener("click", () => {

        const name = document.getElementById("simExpenseName").value.trim();
        const amountInput = document.getElementById("simExpenseAmount");
        const amount = Number(amountInput.value);
        const type = document.getElementById("simExpenseType").value;

        if (!name || amountInput.value.trim() === "" ||
            !Number.isFinite(amount) || amount <= 0) {

            showMessage("Enter an expense name and a valid amount.");
            return;
        }

        if (simEditingId !== null) {

            simData.expenses = simData.expenses.map(item =>
                item.id === simEditingId
                    ? { ...item, name, amount, type }
                    : item
            );

            showMessage("Planned expense updated.");

        } else {

            simData.expenses.push({
                id: Date.now().toString(),
                name,
                amount,
                type,
                selected: true
            });

            showMessage("Planned expense added.");
        }

        simEditingId = null;

        saveSimData();

        document.getElementById("simExpenseForm").style.display = "none";

        renderSimExpenses();
        renderSimSummary();
    });


// EXPENSE LIST ACTIONS
document.addEventListener("click", event => {

    const editButton = event.target.closest("[data-sim-edit]");

    if (editButton) {

        const id = editButton.dataset.simEdit;

        const item = simData.expenses.find(expense => expense.id === id);

        if (!item) return;

        simEditingId = id;

        document.getElementById("simExpenseName").value = item.name;
        document.getElementById("simExpenseAmount").value = item.amount;
        document.getElementById("simExpenseType").value = item.type;

        document.getElementById("simSaveExpense").textContent =
            "UPDATE EXPENSE";

        document.getElementById("simExpenseForm").style.display = "block";

        document.getElementById("simExpenseForm").scrollIntoView({
            behavior: "smooth",
            block: "nearest"
        });
    }


    const deleteButton = event.target.closest("[data-sim-delete]");

    if (deleteButton) {

        const id = deleteButton.dataset.simDelete;

        if (!confirm("Delete this planned expense?")) return;

        simData.expenses = simData.expenses.filter(
            item => item.id !== id
        );

        saveSimData();
        renderSimExpenses();
        renderSimSummary();

        showMessage("Planned expense deleted.");
    }
});


// INCLUDE OR EXCLUDE EXPENSE
document.addEventListener("change", event => {

    const checkbox = event.target.closest("[data-sim-check]");

    if (!checkbox) return;

    const item = simData.expenses.find(
        expense => expense.id === checkbox.dataset.simCheck
    );

    if (!item) return;

    item.selected = checkbox.checked;

    saveSimData();
    renderSimSummary();
});


// SELECT ALL EXPENSES
document.getElementById("simSelectAll")
    .addEventListener("click", () => {

        const allSelected = simData.expenses.every(item => item.selected);

        simData.expenses.forEach(item => {
            item.selected = !allSelected;
        });

        saveSimData();
        renderSimExpenses();
        renderSimSummary();
    });


// RESET CURRENT SIMULATION
document.getElementById("simReset")
    .addEventListener("click", () => {

        if (!confirm(
            "Reset the current simulation?\n\n" +
            "Your saved scenarios will remain safe."
        )) return;

        simData = {
            budget: 0,
            expenses: []
        };

        saveSimData();

        document.getElementById("simExpenseForm").style.display = "none";

        renderBudgetSimulator();

        showMessage("Current simulation has been reset.");
    });


// SAVE SCENARIO
document.getElementById("simSaveScenario")
    .addEventListener("click", () => {

        if (simData.budget <= 0) {
            showMessage("Set your available budget first.");
            return;
        }

        if (simData.expenses.length === 0) {
            showMessage("Add planned expenses before saving.");
            return;
        }

        const name = prompt("Enter a name for this budget scenario:");

        if (!name || !name.trim()) return;

        simScenarios.push({
            id: Date.now().toString(),
            name: name.trim(),
            date: new Date().toLocaleDateString("en-PH"),
            data: JSON.parse(JSON.stringify(simData))
        });

        saveSimScenarios();
        renderSimScenarios();

        showMessage("Budget scenario saved.");
    });


// DISPLAY SAVED SCENARIOS
function renderSimScenarios() {

    const list = document.getElementById("simScenarioList");

    if (!list) return;

    if (simScenarios.length === 0) {
        list.innerHTML = '<p class="sim-empty">No saved scenarios yet.</p>';
        return;
    }

    list.innerHTML = simScenarios.map(scenario => `
        <div class="sim-scenario-row">

            <div>
                <strong>${simEscape(scenario.name)}</strong>
                <small>${simEscape(scenario.date)} · Budget: ${money(scenario.data.budget)}</small>
            </div>

            <div class="sim-row-actions">
                <button type="button"
                    data-sim-load="${scenario.id}">LOAD</button>

                <button type="button"
                    data-sim-remove="${scenario.id}">×</button>
            </div>

        </div>
    `).join("");
}


// LOAD OR DELETE SAVED SCENARIO
document.addEventListener("click", event => {

    const loadButton = event.target.closest("[data-sim-load]");

    if (loadButton) {

        const scenario = simScenarios.find(
            item => item.id === loadButton.dataset.simLoad
        );

        if (!scenario) return;

        if (!confirm(
            "Load this saved scenario?\n\n" +
            "Your current simulation will be replaced."
        )) return;

        simData = JSON.parse(JSON.stringify(scenario.data));

        saveSimData();
        renderBudgetSimulator();

        showMessage("Saved scenario loaded.");
    }


    const removeButton = event.target.closest("[data-sim-remove]");

    if (removeButton) {

        if (!confirm("Delete this saved scenario?")) return;

        simScenarios = simScenarios.filter(
            item => item.id !== removeButton.dataset.simRemove
        );

        saveSimScenarios();
        renderSimScenarios();

        showMessage("Saved scenario deleted.");
    }
});


// INITIAL DISPLAY
renderBudgetSimulator();
renderSimScenarios();

// ========================================
// PESOMATE - BEFORE YOU BUY
// WITH EXPECTED EXPENSES
// ========================================

const PURCHASE_STORAGE_KEY = "pesomate_purchase_history_v1";
const EXPECTED_EXPENSE_STORAGE_KEY = "pesomate_expected_expenses_v1";

let purchaseHistory = JSON.parse(
    localStorage.getItem(PURCHASE_STORAGE_KEY) || "[]"
);

let expectedExpenses = JSON.parse(
    localStorage.getItem(EXPECTED_EXPENSE_STORAGE_KEY) || "[]"
);

let currentPurchaseDecision = null;


// ========================================
// SAVE DATA
// ========================================

function savePurchaseHistory() {

    localStorage.setItem(
        PURCHASE_STORAGE_KEY,
        JSON.stringify(purchaseHistory)
    );

}

function saveExpectedExpenses() {

    localStorage.setItem(
        EXPECTED_EXPENSE_STORAGE_KEY,
        JSON.stringify(expectedExpenses)
    );

}


// ========================================
// CALCULATE EXPECTED EXPENSES
// ========================================

function getExpectedExpensesTotal() {

    return expectedExpenses.reduce(
        (sum, item) => sum + Number(item.amount),
        0
    );

}

function getAdjustedPurchaseBalance() {

    const actualAvailable = getAvailableNecessities();

    const expectedTotal = getExpectedExpensesTotal();

    return actualAvailable - expectedTotal;

}


// ========================================
// DISPLAY BEFORE YOU BUY
// ========================================

function renderBeforeYouBuy() {

    const actualAvailable = getAvailableNecessities();

    const expectedTotal = getExpectedExpensesTotal();

    const adjustedBalance = actualAvailable - expectedTotal;

    document.getElementById("purchaseAvailableBalance")
        .textContent = money(actualAvailable);

    document.getElementById("expectedActualBalance")
        .textContent = money(actualAvailable);

    document.getElementById("expectedExpensesTotal")
        .textContent = money(expectedTotal);

    const adjustedElement =
        document.getElementById("expectedAdjustedBalance");

    adjustedElement.textContent = money(adjustedBalance);

    adjustedElement.style.color =
        adjustedBalance < 0 ? "#e94b63" : "#087b55";

    renderExpectedExpenses();

    renderPurchaseHistory();

}


// ========================================
// ADD EXPECTED EXPENSE
// ========================================

document.getElementById("addExpectedExpense")
    .addEventListener("click", () => {

        const nameInput =
            document.getElementById("expectedExpenseName");

        const amountInput =
            document.getElementById("expectedExpenseAmount");

        const dateInput =
            document.getElementById("expectedExpenseDate");

        const name = nameInput.value.trim();

        const amount = Number(amountInput.value);

        const date = dateInput.value;

        if (
            !name ||
            amountInput.value.trim() === "" ||
            !Number.isFinite(amount) ||
            amount <= 0
        ) {

            showMessage(
                "Please enter an expense description and a valid amount."
            );

            return;

        }

        expectedExpenses.push({

            id: Date.now(),

            name: name,

            amount: amount,

            date: date

        });

        saveExpectedExpenses();

        nameInput.value = "";
        amountInput.value = "";
        dateInput.value = "";

        document.getElementById("purchaseResult").style.display = "none";

        currentPurchaseDecision = null;

        renderBeforeYouBuy();

        showMessage("Expected expense added successfully.");

    });


// ========================================
// DISPLAY EXPECTED EXPENSES
// ========================================

function renderExpectedExpenses() {

    const container =
        document.getElementById("expectedExpensesList");

    container.innerHTML = "";

    if (expectedExpenses.length === 0) {

        container.innerHTML =
            '<p class="purchase-empty">No expected expenses added yet.</p>';

        return;

    }

    expectedExpenses.forEach(expense => {

        const row = document.createElement("div");

        row.className = "expected-expense-item";

        const details = document.createElement("div");

        details.className = "expected-expense-details";

        const name = document.createElement("strong");

        name.textContent = expense.name;

        const amount = document.createElement("span");

        amount.textContent = money(expense.amount);

        const date = document.createElement("small");

        date.textContent = expense.date
            ? "Expected payment: " + expense.date
            : "Payment date not specified";

        details.append(name, amount, date);

        const actions = document.createElement("div");

        actions.className = "expected-expense-actions";

        const editButton = document.createElement("button");

        editButton.type = "button";
        editButton.textContent = "EDIT";

        editButton.addEventListener("click", () => {

            const newName = prompt(
                "Edit expense description:",
                expense.name
            );

            if (newName === null) return;

            const cleanName = newName.trim();

            if (!cleanName) {

                showMessage("Expense description cannot be empty.");
                return;

            }

            const newAmount = prompt(
                "Edit expected amount:",
                expense.amount
            );

            if (newAmount === null) return;

            const amountValue = Number(newAmount);

            if (
                newAmount.trim() === "" ||
                !Number.isFinite(amountValue) ||
                amountValue <= 0
            ) {

                showMessage("Please enter a valid amount.");
                return;

            }

            const newDate = prompt(
                "Edit expected payment date (YYYY-MM-DD). Leave blank if unknown:",
                expense.date || ""
            );

            if (newDate === null) return;

            expense.name = cleanName;
            expense.amount = amountValue;
            expense.date = newDate.trim();

            saveExpectedExpenses();

            document.getElementById("purchaseResult").style.display = "none";

            currentPurchaseDecision = null;

            renderBeforeYouBuy();

            showMessage("Expected expense updated.");

        });

        const deleteButton = document.createElement("button");

        deleteButton.type = "button";
        deleteButton.textContent = "×";

        deleteButton.addEventListener("click", () => {

            if (!confirm("Delete this expected expense?")) return;

            expectedExpenses = expectedExpenses.filter(
                item => item.id !== expense.id
            );

            saveExpectedExpenses();

            document.getElementById("purchaseResult").style.display = "none";

            currentPurchaseDecision = null;

            renderBeforeYouBuy();

            showMessage("Expected expense deleted.");

        });

        actions.append(editButton, deleteButton);

        row.append(details, actions);

        container.appendChild(row);

    });

}


// ========================================
// EVALUATE PURCHASE
// ========================================

document.getElementById("evaluatePurchase")
    .addEventListener("click", () => {

        const item = document.getElementById("purchaseItem")
            .value.trim();

        const priceInput =
            document.getElementById("purchasePrice");

        const price = Number(priceInput.value);

        const type =
            document.getElementById("purchaseType").value;

        const priority =
            document.getElementById("purchasePriority").value;

        const reason =
            document.getElementById("purchaseReason").value.trim();

        const actualAvailable = getAvailableNecessities();

        const expectedTotal = getExpectedExpensesTotal();

        const adjustedAvailable =
            actualAvailable - expectedTotal;

        const remaining = adjustedAvailable - price;

        if (
            !item ||
            priceInput.value.trim() === "" ||
            !Number.isFinite(price) ||
            price <= 0
        ) {

            showMessage(
                "Please enter an item name and a valid purchase price."
            );

            return;

        }

        let decision = "";
        let advice = "";
        let resultClass = "";

        if (adjustedAvailable < 0 || price > adjustedAvailable) {

            decision = "DON'T BUY YET";

            resultClass = "dont-buy";

            advice =
                "Your expected expenses already reduce your available " +
                "Necessities Fund. This purchase would exceed the balance " +
                "remaining after those expenses. Postpone the purchase " +
                "or consider a less expensive alternative.";

        } else if (type === "Need" && priority === "High") {

            decision = "BUY NOW";

            resultClass = "buy-now";

            advice =
                "This is a high-priority necessity. Your adjusted " +
                "Necessities Fund can cover the purchase after accounting " +
                "for your expected expenses. Review your remaining balance.";

        } else {

            decision = "THINK AGAIN";

            resultClass = "think-again";

            advice =
                "Your adjusted balance can cover this purchase, but " +
                "consider whether it is necessary right now. Protect " +
                "your funds for your expected expenses and other needs.";

        }

        currentPurchaseDecision = {

            id: Date.now(),

            item: item,

            price: price,

            type: type,

            priority: priority,

            reason: reason,

            available: actualAvailable,

            expectedExpenses: expectedTotal,

            adjustedAvailable: adjustedAvailable,

            remaining: remaining,

            decision: decision,

            date: new Date().toLocaleDateString()

        };

        const result =
            document.getElementById("purchaseResult");

        result.style.display = "block";

        result.className = "purchase-result " + resultClass;

        document.getElementById("purchaseDecision")
            .textContent = decision;

        document.getElementById("purchaseAdvice")
            .textContent = advice;

        document.getElementById("purchaseResultAvailable")
            .textContent = money(actualAvailable);

        document.getElementById("purchaseResultExpected")
            .textContent = money(expectedTotal);

        document.getElementById("purchaseResultAdjusted")
            .textContent = money(adjustedAvailable);

        document.getElementById("purchaseResultPrice")
            .textContent = money(price);

        document.getElementById("purchaseResultRemaining")
            .textContent = money(remaining);

        result.scrollIntoView({

            behavior: "smooth",

            block: "start"

        });

    });


// ========================================
// SAVE PURCHASE DECISION
// ========================================

document.getElementById("savePurchaseDecision")
    .addEventListener("click", () => {

        if (!currentPurchaseDecision) {

            showMessage("Please evaluate a purchase first.");

            return;

        }

        purchaseHistory.unshift(currentPurchaseDecision);

        savePurchaseHistory();

        renderPurchaseHistory();

        showMessage("Purchase decision saved successfully.");

    });


// ========================================
// DISPLAY PURCHASE HISTORY
// ========================================

function renderPurchaseHistory() {

    const container =
        document.getElementById("purchaseHistory");

    if (!container) return;

    container.innerHTML = "";

    if (purchaseHistory.length === 0) {

        container.innerHTML =
            '<p class="purchase-empty">No purchase decisions recorded yet.</p>';

        return;

    }

    purchaseHistory.forEach(record => {

        const card = document.createElement("div");

        card.className = "purchase-history-item";

        const name = document.createElement("strong");

        name.textContent = record.item;

        const details = document.createElement("small");

        details.textContent =
            record.date + " • " +
            record.type + " • " +
            money(record.price);

        const decision = document.createElement("small");

        decision.className = "history-decision";

        decision.textContent = record.decision;

        const balance = document.createElement("small");

        balance.textContent =
            "Adjusted balance: " +
            money(
                record.adjustedAvailable !== undefined
                    ? record.adjustedAvailable
                    : record.available
            );

        const remove = document.createElement("button");

        remove.type = "button";

        remove.textContent = "DELETE";

        remove.addEventListener("click", () => {

            if (!confirm("Delete this purchase decision?")) return;

            purchaseHistory = purchaseHistory.filter(
                item => item.id !== record.id
            );

            savePurchaseHistory();

            renderPurchaseHistory();

        });

        card.append(name, details, balance, decision, remove);

        container.appendChild(card);

    });

}


// ========================================
// RESET BEFORE YOU BUY FORM
// ========================================

document.getElementById("resetPurchase")
    .addEventListener("click", () => {

        if (!confirm(
            "Reset the purchase form and assessment? Your expected expenses and saved decision history will remain."
        )) {

            return;

        }

        document.getElementById("purchaseItem").value = "";

        document.getElementById("purchasePrice").value = "";

        document.getElementById("purchaseType").value = "Need";

        document.getElementById("purchasePriority").value = "High";

        document.getElementById("purchaseReason").value = "";

        document.getElementById("purchaseResult").style.display = "none";

        currentPurchaseDecision = null;

        renderBeforeYouBuy();

        showMessage("Purchase assessment has been reset.");

    });

// ========================================
// PESOMATE - MONEY SURVIVAL CALCULATOR
// MANUAL MONEY JAR ALLOCATION
// ========================================

let survivalExpenses = [];
let survivalEmergencyApproved = false;


// GET MANUAL INPUT VALUES
function getSurvivalAmount(id) {
    const value = Number(document.getElementById(id).value);
    return Number.isFinite(value) && value > 0 ? value : 0;
}


// ========================================
// INTERACTIVE MONEY JAR PERCENTAGES
// ========================================

let survivalNecessitiesPercent = 60;
let survivalEmergencyPercent = 40;


// GET FUND AMOUNTS
function getSurvivalFunds() {

    const total = getSurvivalAmount("survivalTotalAvailable");

    const necessities = total * survivalNecessitiesPercent / 100;
    const emergency = total * survivalEmergencyPercent / 100;

    return {
        total: total,
        necessities: necessities,
        emergency: emergency,
        allocated: necessities + emergency,
        undistributed: 0,
        valid: total > 0
    };
}


// UPDATE JAR VISUALS AND AMOUNTS
function calculateSurvivalAllocation() {

    const funds = getSurvivalFunds();

    document.getElementById("necessitiesPercentage").textContent =
        survivalNecessitiesPercent + "%";

    document.getElementById("emergencyPercentage").textContent =
        survivalEmergencyPercent + "%";

    document.getElementById("necessitiesJarFill").style.height =
        survivalNecessitiesPercent + "%";

    document.getElementById("emergencyJarFill").style.height =
        survivalEmergencyPercent + "%";

    document.getElementById("necessitiesJarAmount").textContent =
        money(funds.necessities);

    document.getElementById("emergencyJarAmount").textContent =
        money(funds.emergency);

    document.getElementById("survivalAllocatedTotal").textContent =
        money(funds.allocated);

    document.getElementById("survivalUndistributed").textContent =
        money(funds.undistributed);

    const message =
        document.getElementById("survivalAllocationMessage");

    if (funds.total > 0) {

        message.textContent =
            "✓ Your Money Jar is fully allocated: " +
            survivalNecessitiesPercent + "% Necessities and " +
            survivalEmergencyPercent + "% Emergency Fund.";

        message.className =
            "survival-result survival-feasible";

    } else {

        message.textContent =
            "Enter your total available money to calculate your fund amounts.";

        message.className = "survival-result";

    }

    return funds;
}

// SET TOTAL AVAILABLE MONEY
document.getElementById("setSurvivalAmount")
    .addEventListener("click", () => {

        const amount = Number(
            document.getElementById("survivalTotalAvailable").value
        );

        if (!amount || amount <= 0) {
            alert("Please enter a valid amount.");
            return;
        }

        survivalEmergencyApproved = false;
        calculateSurvivalResult();

        showMessage("Total available money has been set.");

    });

// ADJUST PERCENTAGES
document.querySelectorAll("[data-fund][data-change]")
    .forEach(button => {

        button.addEventListener("click", () => {

            const fund = button.dataset.fund;
            const change = Number(button.dataset.change);

            // Adjust the selected fund
            if (fund === "necessities") {
                survivalNecessitiesPercent += change;
            } else if (fund === "emergency") {
                survivalNecessitiesPercent -= change;
            }

            // Keep percentages between 0 and 100
            survivalNecessitiesPercent = Math.max(
                0,
                Math.min(100, survivalNecessitiesPercent)
            );

            // Automatically maintain a 100% total
            survivalEmergencyPercent =
                100 - survivalNecessitiesPercent;

            survivalEmergencyApproved = false;

            // Refresh both jars and their amounts
            calculateSurvivalResult();

        });

    });

// ========================================
// FUND AVAILABILITY PERIOD
// ========================================

function calculateSurvivalPeriod() {

    const periodType =
        document.getElementById("survivalPeriodType").value;

    const duration =
        Number(document.getElementById("survivalPeriodValue").value);

    const funds = getSurvivalFunds();

    const allowanceElement =
        document.getElementById("survivalPeriodAllowance");

    const labelElement =
        document.getElementById("survivalPeriodLabel");

    const fundElement =
        document.getElementById("survivalPeriodFund");

    if (!funds.valid || !Number.isInteger(duration) || duration <= 0) {

        allowanceElement.textContent = "₱0.00";

        labelElement.textContent =
            periodType === "days"
                ? "Daily Necessities Allowance"
                : "Monthly Necessities Allowance";

        fundElement.textContent =
            "Enter your available money and a valid duration.";

        return;
    }

    const allowance = funds.necessities / duration;

    labelElement.textContent =
        periodType === "days"
            ? "Daily Necessities Allowance"
            : "Monthly Necessities Allowance";

    allowanceElement.textContent = money(allowance);

    fundElement.textContent =
        money(funds.necessities) +
        " Necessities Fund ÷ " +
        duration +
        (periodType === "days" ? " days" : " months");
}

// UPDATE WHEN DURATION CHANGES
document.getElementById("survivalPeriodType")
    .addEventListener("change", renderSurvivalCalculator);

document.getElementById("survivalPeriodValue")
    .addEventListener("input", renderSurvivalCalculator);

// ========================================
// RECURRING EXPENSE CALCULATIONS
// ========================================

function getSurvivalPeriodDays() {

    const type = document.getElementById("survivalPeriodType").value;
    const duration = Number(
        document.getElementById("survivalPeriodValue").value
    );

    if (!Number.isFinite(duration) || duration <= 0) return 0;

    return type === "months" ? duration * 30 : duration;
}


function getExpenseOccurrences(frequency) {

    const days = getSurvivalPeriodDays();

    if (frequency === "once") return 1;
    if (days <= 0) return 0;

    const intervals = {
        daily: 1,
        every2days: 2,
        weekly: 7,
        every2weeks: 14
    };

    // Daily and weekly expenses
    if (intervals[frequency]) {
        return Math.ceil(days / intervals[frequency]);
    }

    // Monthly and longer intervals
    const months = days / 30;

    const monthIntervals = {
        monthly: 1,
        every2months: 2,
        quarterly: 3,
        yearly: 12
    };

    const interval = monthIntervals[frequency];

    if (!interval) return 0;

    return Math.floor((months + 0.000001) / interval);
}


// PROJECTED TOTAL OF CHECKED EXPENSES
function getSelectedSurvivalExpenseTotal() {

    return survivalExpenses
        .filter(item => item.selected !== false)
        .reduce((sum, item) => {

            const occurrences =
                getExpenseOccurrences(item.frequency || "once");

            return sum +
                Number(item.amount) * occurrences;

        }, 0);
}

// ========================================
// CALCULATE SURVIVAL RESULT
// NECESSITIES FIRST, EMERGENCY SECOND
// ========================================

function calculateSurvivalResult() {

    const allocation = calculateSurvivalAllocation();
    calculateSurvivalPeriod();
    

const totalExpenses = getSelectedSurvivalExpenseTotal();

    const necessities = allocation.necessities;
    const emergency = allocation.emergency;

    const shortfall = Math.max(
        0,
        totalExpenses - necessities
    );

    const combinedFunds = necessities + emergency;

    const totalRemaining = Math.max(
        0,
        combinedFunds - totalExpenses
    );

    document.getElementById("survivalTotalExpenses").textContent =
        money(totalExpenses);

    document.getElementById("survivalAvailableNecessities").textContent =
        money(necessities);

    document.getElementById("survivalShortfall").textContent =
        money(shortfall);

    const result =
        document.getElementById("survivalResult");

    const approvalBox =
        document.getElementById("survivalEmergencyApproval");

    const emergencyMessage =
        document.getElementById("survivalEmergencyMessage");

    // Hide approval prompt before making a new assessment
    approvalBox.style.display = "none";


    // 1. CHECK VALID FUNDS

    if (!allocation.valid) {

        survivalEmergencyApproved = false;

        result.textContent =
            "Please enter a valid Total Available Money and check your fund allocations.";

        result.className =
            "survival-result survival-warning";

        return;
    }


    // 2. NO EXPENSES

    if (totalExpenses === 0) {

        survivalEmergencyApproved = false;

        result.textContent =
            "Add your expenses to begin the assessment.";

        result.className =
            "survival-result";

        return;
    }


    // 3. NECESSITIES FUND COVERS EVERYTHING

    if (totalExpenses <= necessities) {

        survivalEmergencyApproved = false;

        result.textContent =
            "✓ FEASIBLE — Your Necessities Fund can cover all expenses. Your Emergency Fund remains untouched. Remaining Necessities Fund: " +
            money(necessities - totalExpenses);

        result.className =
            "survival-result survival-feasible";

        return;
    }


    // 4. NECESSITIES FUND IS NOT ENOUGH
    // CHECK IF USER HAS APPROVED EMERGENCY FUND USE

    if (survivalEmergencyApproved) {

        // EMERGENCY FUND CAN COVER THE SHORTFALL

        if (shortfall <= emergency) {

            const remainingEmergency =
                emergency - shortfall;

            result.textContent =
                "✓ FEASIBLE — WITH EMERGENCY FUND. Your Necessities Fund will be used first, followed by " +
                money(shortfall) +
                " from your Emergency Fund. Remaining Emergency Fund: " +
                money(remainingEmergency) +
                ". This is a simulation only; no actual money has been deducted.";

            result.className =
                "survival-result survival-feasible";

        }

        // BOTH FUNDS ARE STILL NOT ENOUGH

        else {

            const additionalShortfall =
                shortfall - emergency;

            result.textContent =
                "✕ NOT FEASIBLE — INSUFFICIENT FUNDS. Even after using your entire Emergency Fund, you will still be short by " +
                money(additionalShortfall) +
                ".";

            result.className =
                "survival-result survival-not-feasible";

        }

        return;
    }


    // 5. ASK USER BEFORE USING EMERGENCY FUND

    emergencyMessage.textContent =
        "Your planned expenses exceed your Necessities Fund by " +
        money(shortfall) +
        ". Your Emergency Fund contains " +
        money(emergency) +
        ". Would you like to use it to cover the shortfall?";

    approvalBox.style.display = "block";

    result.textContent =
        "⚠️ NECESSITIES FUND INSUFFICIENT — Your decision is required before using your Emergency Fund.";

    result.className =
        "survival-result survival-warning";

}

// ========================================
// DISPLAY SURVIVAL EXPENSES
// ========================================

function renderSurvivalExpenses() {

    const list = document.getElementById("survivalExpenseList");

    if (!list) return;

    list.innerHTML = "";

    if (survivalExpenses.length === 0) {
        list.innerHTML =
            '<p class="survival-empty">No expenses added yet.</p>';
        return;
    }

    survivalExpenses.forEach((item, index) => {

        if (item.selected === undefined) {
            item.selected = true;
        }

        if (!item.frequency) {
            item.frequency = "once";
        }

        const occurrences =
            getExpenseOccurrences(item.frequency);

        const projectedTotal =
            Number(item.amount) * occurrences;

        const row = document.createElement("div");
        row.className = "survival-expense-row";

        // CHECKBOX
        const checkbox = document.createElement("input");
        checkbox.type = "checkbox";
        checkbox.checked = item.selected !== false;
        checkbox.className = "survival-expense-check";

        checkbox.addEventListener("change", () => {
            item.selected = checkbox.checked;
            survivalEmergencyApproved = false;
            renderSurvivalCalculator();
        });

        // DETAILS
        const details = document.createElement("div");
        details.className = "survival-expense-details";

        const name = document.createElement("strong");
        name.textContent = item.name;

        const amount = document.createElement("span");
        amount.textContent =
            money(Number(item.amount)) + " / occurrence";

        const frequency = document.createElement("small");
        frequency.textContent =
            item.frequency === "once"
                ? "One-time"
                : item.frequency === "every2days"
                    ? "Every 2 days"
                    : item.frequency === "every2weeks"
                        ? "Every 2 weeks"
                        : item.frequency === "every2months"
                            ? "Every 2 months"
                            : item.frequency.charAt(0).toUpperCase() +
                              item.frequency.slice(1);

        const projected = document.createElement("small");
        projected.className = "survival-projected-total";
        projected.textContent =
            "Projected: " + money(projectedTotal) +
            " (" + occurrences + " occurrence" +
            (occurrences === 1 ? "" : "s") + ")";

        details.append(name, amount, frequency, projected);

        // EDIT
        const editButton = document.createElement("button");
        editButton.type = "button";
        editButton.textContent = "EDIT";
        editButton.className = "survival-edit-button";

        editButton.addEventListener("click", () => {

            const newName = prompt(
                "Expense description:",
                item.name
            );

            if (newName === null) return;

            if (!newName.trim()) {
                showMessage("Description cannot be empty.");
                return;
            }

            const newAmount = prompt(
                "Amount per occurrence:",
                item.amount
            );

            if (newAmount === null) return;

            const amountValue = Number(newAmount);

            if (!Number.isFinite(amountValue) || amountValue <= 0) {
                showMessage("Please enter a valid amount.");
                return;
            }

            const newFrequency = prompt(
                "Enter frequency:\n\n" +
                "once\n" +
                "daily\n" +
                "every2days\n" +
                "weekly\n" +
                "every2weeks\n" +
                "monthly\n" +
                "every2months\n" +
                "quarterly\n" +
                "yearly",
                item.frequency
            );

            if (newFrequency === null) return;

            const validFrequencies = [
                "once", "daily", "every2days", "weekly",
                "every2weeks", "monthly", "every2months",
                "quarterly", "yearly"
            ];

            if (!validFrequencies.includes(newFrequency.trim())) {
                showMessage("Please enter a valid frequency.");
                return;
            }

            item.name = newName.trim();
            item.amount = amountValue;
            item.frequency = newFrequency.trim();

            survivalEmergencyApproved = false;
            renderSurvivalCalculator();

            showMessage("Expense updated successfully.");
        });

        // DELETE
        const deleteButton = document.createElement("button");
        deleteButton.type = "button";
        deleteButton.textContent = "×";
        deleteButton.className = "survival-delete-button";

        deleteButton.addEventListener("click", () => {

            if (!confirm("Remove this expense?")) return;

            survivalExpenses.splice(index, 1);
            survivalEmergencyApproved = false;

            renderSurvivalCalculator();

            showMessage("Expense removed.");
        });

        const actions = document.createElement("div");
        actions.className = "survival-expense-actions";
        actions.append(editButton, deleteButton);

        row.append(checkbox, details, actions);
        list.appendChild(row);

    });

}

// MAIN DISPLAY
function renderSurvivalCalculator() {

    renderSurvivalExpenses();

    calculateSurvivalResult();

}


// ADD EXPENSE
document.getElementById("addSurvivalExpense")
    .addEventListener("click", () => {

        const nameInput =
            document.getElementById("survivalExpenseName");

        const amountInput =
            document.getElementById("survivalExpenseAmount");

const name = nameInput.value.trim();
const amount = Number(amountInput.value);

const frequency =
    document.getElementById("survivalExpenseFrequency").value;

        if (!name || !Number.isFinite(amount) || amount <= 0) {

            showMessage("Please enter a valid expense description and amount.");

            return;
        }

survivalExpenses.push({
    name: name,
    amount: amount,
    frequency: frequency,
    selected: true
});

        survivalEmergencyApproved = false;

        nameInput.value = "";
        amountInput.value = "";
        document.getElementById("survivalExpenseFrequency").value = "once";

        renderSurvivalCalculator();

    });


// APPROVE EMERGENCY FUND USE
document.getElementById("approveEmergencyUse")
    .addEventListener("click", () => {

        survivalEmergencyApproved = true;

        calculateSurvivalResult();

    });


// ========================================
// PROTECT EMERGENCY FUND
// ========================================

document.getElementById("protectEmergencyFund")
    .addEventListener("click", () => {

        survivalEmergencyApproved = false;

const totalExpenses = getSelectedSurvivalExpenseTotal();

        const necessities =
            getSurvivalFunds().necessities;

        const shortfall = Math.max(
            0,
            totalExpenses - necessities
        );

        document.getElementById("survivalEmergencyApproval")
            .style.display = "none";

        const result =
            document.getElementById("survivalResult");

        result.textContent =
            "✕ NOT FEASIBLE — You chose to protect your Emergency Fund. Your Necessities Fund is short by " +
            money(shortfall) +
            ". Consider reducing your expenses or adjusting your budget.";

        result.className =
            "survival-result survival-not-feasible";

    });


// RESET CURRENT CALCULATOR ONLY
document.getElementById("resetSurvival")
    .addEventListener("click", () => {

        const confirmed = confirm(
            "Reset this calculator? Your actual financial records and Money Jar will not be affected."
        );

        if (!confirmed) return;

        // Clear total available money
        document.getElementById("survivalTotalAvailable").value = "";

        // Reset jar percentages to default
        survivalNecessitiesPercent = 60;
        survivalEmergencyPercent = 40;
        // Reset availability period
        document.getElementById("survivalPeriodType").value = "days";
        document.getElementById("survivalPeriodValue").value = 30;

        // Clear expense inputs
        document.getElementById("survivalExpenseName").value = "";
        document.getElementById("survivalExpenseAmount").value = "";
        document.getElementById("survivalExpenseFrequency").value = "once";

        // Clear current expenses
        survivalExpenses = [];
        survivalEmergencyApproved = false;

        // Refresh calculator and jar visuals
        renderSurvivalCalculator();

        showMessage("Money Survival Calculator has been reset.");

    });
// ========================================
// PESOMATE THEME SELECTION
// ========================================

function applyAppTheme(theme) {

    document.documentElement.setAttribute(
        "data-theme",
        theme
    );

    localStorage.setItem("pesomateTheme", theme);

    const status = document.getElementById("themeStatus");

if (status) {
    status.textContent =
        theme === "light"
            ? "Light Mode is currently selected."
            : "Dark Mode is currently selected.";
}
}


// Load saved theme when PESOMATE opens
const savedTheme = localStorage.getItem("pesomateTheme") || "light";

applyAppTheme(savedTheme);


// Listen for theme selection
document.querySelectorAll('input[name="appTheme"]').forEach(input => {

    input.addEventListener("change", function() {

        if (this.checked) {
            applyAppTheme(this.value);
        }

    });

});


// Automatically update when device appearance changes
window.matchMedia("(prefers-color-scheme: dark)")
    .addEventListener("change", function() {

        const currentTheme =
            localStorage.getItem("pesomateTheme") || "system";

        if (currentTheme === "system") {
            applyAppTheme("system");
        }

    });