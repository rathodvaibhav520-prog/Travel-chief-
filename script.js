document.addEventListener('DOMContentLoaded', () => {
    // STATE
    let activeStep = 1;

    // DOM ELEMENTS
    const navLinks = document.querySelectorAll('.nav-link');
    const viewPanels = document.querySelectorAll('.view-panel');
    const createTripModal = document.getElementById('createTripModal');
    const openModalBtn = document.getElementById('openCreateTripBtn');
    const closeModalBtn = document.getElementById('closeModalBtn');
    const nextStepBtn = document.getElementById('nextStepBtn');
    const prevStepBtn = document.getElementById('prevStepBtn');
    const submitTripBtn = document.getElementById('submitTripBtn');
    const tripsGrid = document.getElementById('tripsGrid');

    // INITIALIZE DATA
    fetchDashboardData();
    fetchTrips();
    fetchExpenses();

    // VIEW SWITCHING
    navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const targetView = link.getAttribute('data-view');
            
            navLinks.forEach(n => n.classList.remove('active'));
            viewPanels.forEach(p => p.classList.remove('active'));

            link.classList.add('active');
            const activePanel = document.getElementById(`view-${targetView}`);
            if(activePanel) activePanel.classList.add('active');
        });
    });

    // OPEN / CLOSE MODAL
    if(openModalBtn) {
        openModalBtn.addEventListener('click', () => {
            createTripModal.style.display = 'flex';
            resetWizard();
        });
    }

    if(closeModalBtn) {
        closeModalBtn.addEventListener('click', () => {
            createTripModal.style.display = 'none';
        });
    }

    // MULTI-STEP WIZARD NAVIGATION
    nextStepBtn.addEventListener('click', () => {
        if(activeStep < 3) {
            activeStep++;
            updateWizardUI();
        }
    });

    prevStepBtn.addEventListener('click', () => {
        if(activeStep > 1) {
            activeStep--;
            updateWizardUI();
        }
    });

    function updateWizardUI() {
        document.querySelectorAll('.wizard-step-panel').forEach(p => p.classList.remove('active'));
        document.querySelectorAll('.step-dot').forEach(d => d.classList.remove('active'));

        document.getElementById(`step-${activeStep}`).classList.add('active');
        document.querySelector(`.step-dot[data-step="${activeStep}"]`).classList.add('active');

        prevStepBtn.style.display = activeStep === 1 ? 'none' : 'block';
        if(activeStep === 3) {
            nextStepBtn.style.display = 'none';
            submitTripBtn.style.display = 'block';
        } else {
            nextStepBtn.style.display = 'block';
            submitTripBtn.style.display = 'none';
        }
    }

    function resetWizard() {
        activeStep = 1;
        updateWizardUI();
    }

    // API FETCHERS
    async function fetchDashboardData() {
        try {
            const res = await fetch('/api/dashboard');
            const data = await res.json();
            
            document.getElementById('statTotalTrips').textContent = `${data.total_trips} Active`;
            document.getElementById('statTotalBudget').textContent = `$${data.total_budget.toLocaleString()}`;
            document.getElementById('statTotalExpenses').textContent = `$${data.total_expenses.toLocaleString()}`;
            document.getElementById('statRemaining').textContent = `$${data.remaining_budget.toLocaleString()}`;
        } catch(e) {
            console.error("Dashboard fetch error:", e);
        }
    }

    async function fetchTrips() {
        try {
            const res = await fetch('/api/trips');
            const trips = await res.json();
            renderTrips(trips);
        } catch(e) {
            console.error("Trips fetch error:", e);
        }
    }

    function renderTrips(trips) {
        if(!tripsGrid) return;
        tripsGrid.innerHTML = trips.map(trip => `
            <div class="trip-card glass-card">
                <img src="${trip.cover_image}" alt="${trip.title}">
                <div style="padding: 1rem 0;">
                    <div style="display:flex; justify-content:space-between; align-items:center;">
                        <h3>${trip.title}</h3>
                        <span class="gold-text-bold">$${trip.budget.toLocaleString()}</span>
                    </div>
                    <p style="color: var(--text-muted); font-size:0.9rem; margin-top:0.3rem;">
                        <i class="fa-solid fa-location-dot"></i> ${trip.destination}, ${trip.country}
                    </p>
                    <p style="color: var(--text-muted); font-size:0.85rem; margin-top:0.2rem;">
                        <i class="fa-regular fa-calendar"></i> ${trip.start_date} to ${trip.end_date}
                    </p>
                </div>
            </div>
        `).join('');
    }

    async function fetchExpenses() {
        try {
            const res = await fetch('/api/expenses');
            const expenses = await res.json();
            renderExpenses(expenses);
        } catch(e) {
            console.error("Expenses fetch error:", e);
        }
    }

    function renderExpenses(expenses) {
        const txList = document.getElementById('transactionList');
        if(!txList) return;
        txList.innerHTML = expenses.map(exp => `
            <li style="display:flex; justify-content:space-between; padding:0.75rem 0; border-bottom:1px solid rgba(255,255,255,0.05);">
                <div>
                    <strong>${exp.title}</strong>
                    <p style="font-size:0.8rem; color:var(--text-muted);">${exp.category} • ${exp.date}</p>
                </div>
                <span style="color:#F87171; font-weight:600;">-$${exp.amount.toLocaleString()}</span>
            </li>
        `).join('');
    }

    // SUBMIT NEW TRIP FORM
    const createTripForm = document.getElementById('createTripForm');
    if(createTripForm) {
        createTripForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const payload = {
                title: document.getElementById('inputTitle').value,
                destination: document.getElementById('inputDestination').value,
                country: document.getElementById('inputCountry').value,
                start_date: document.getElementById('inputStartDate').value,
                end_date: document.getElementById('inputEndDate').value,
                travelers: parseInt(document.getElementById('inputTravelers').value),
                budget: parseFloat(document.getElementById('inputBudget').value),
                cover_image: document.getElementById('inputCover').value
            };

            const res = await fetch('/api/trips', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            if(res.ok) {
                createTripModal.style.display = 'none';
                fetchDashboardData();
                fetchTrips();
                showToast("Luxury journey successfully scheduled!");
            }
        });
    }

    function showToast(msg) {
        const container = document.getElementById('toastContainer');
        const toast = document.createElement('div');
        toast.className = 'glass-card';
        toast.style.cssText = 'background:var(--gold-accent); color:black; font-weight:bold; padding:1rem 1.5rem; margin-top:0.5rem; border-radius:30px;';
        toast.textContent = msg;
        container.appendChild(toast);
        setTimeout(() => toast.remove(), 3500);
    }
});