class OPPlan {
    constructor() {
        this.patients = JSON.parse(localStorage.getItem('patients')) || [];
        this.operations = JSON.parse(localStorage.getItem('operations')) || [];
        
        // Debug: verifică datele încărcate
        console.log('=== CONSTRUCTOR DEBUG ===');
        console.log('Pacienți încărcați din localStorage:', this.patients.length);
        console.log('Operații încărcate din localStorage:', this.operations.length);
        this.surgeryTypes = JSON.parse(localStorage.getItem('surgeryTypes')) || [
            {id: 'appendicita', name: 'Apendicită'},
            {id: 'colecistectomie', name: 'Colecistectomie'},
            {id: 'hernie', name: 'Hernie'},
            {id: 'cardio', name: 'Chirurgie Cardio'},
            {id: 'ortopedica', name: 'Chirurgie Ortopedică'},
            {id: 'plastica', name: 'Chirurgie Plastică'},
            {id: 'alta', name: 'Altă operație'}
        ];
        this.surgeons = JSON.parse(localStorage.getItem('surgeons')) || [
            'Dr. Popescu Ion',
            'Dr. Ionescu Maria',
            'Dr. Georgescu Andrei'
        ];
        this.currentDate = new Date();
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.updateFormOptions();
        this.renderPatients();
        this.renderOperations();
        this.renderCalendar();
        
        // Set minimum date to today
        const today = new Date().toISOString().split('T')[0];
        document.getElementById('surgery-date').min = today;
    }

    setupEventListeners() {
        // Form submissions
        document.getElementById('combined-form').addEventListener('submit', (e) => {
            e.preventDefault();
            this.addPatientAndOperation();
        });

        // Search functionality
        document.getElementById('search-patients').addEventListener('input', (e) => {
            this.searchPatients(e.target.value);
        });

        // Age calculation on birth date change
        document.getElementById('patient-birthdate').addEventListener('change', (e) => {
            this.calculateAge(e.target.value);
        });

        // Surgery type change handler
        document.getElementById('surgery-type').addEventListener('change', (e) => {
            this.handleSurgeryTypeChange(e.target.value);
        });

        // Admission date change handler
        document.getElementById('admission-date').addEventListener('change', (e) => {
            this.calculateDatesFromAdmission(e.target.value);
        });

        // Ambulatory checkbox handler
        document.getElementById('ambulatory').addEventListener('change', (e) => {
            this.handleAmbulatoryChange(e.target.checked);
        });

        // Make the entire checkbox wrapper clickable
        document.querySelector('.checkbox-wrapper').addEventListener('click', (e) => {
            if (e.target !== document.getElementById('ambulatory')) {
                const checkbox = document.getElementById('ambulatory');
                checkbox.checked = !checkbox.checked;
                this.handleAmbulatoryChange(checkbox.checked);
            }
        });
    }

    calculateAge(birthDate) {
        if (!birthDate) {
            document.getElementById('patient-age').value = '';
            return;
        }

        const today = new Date();
        const birth = new Date(birthDate);
        let age = today.getFullYear() - birth.getFullYear();
        const monthDiff = today.getMonth() - birth.getMonth();
        
        if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
            age--;
        }

        document.getElementById('patient-age').value = age + ' ani';
    }

    handleSurgeryTypeChange(value) {
        const customGroup = document.getElementById('custom-surgery-group');
        const customInput = document.getElementById('custom-surgery-type');
        
        if (value === 'custom') {
            customGroup.style.display = 'block';
            customInput.required = true;
        } else {
            customGroup.style.display = 'none';
            customInput.required = false;
            customInput.value = '';
        }
    }

    calculateDatesFromAdmission(admissionDate) {
        if (!admissionDate) {
            document.getElementById('surgery-date').value = '';
            document.getElementById('discharge-date').value = '';
            return;
        }

        const admission = new Date(admissionDate);
        const isAmbulatory = document.getElementById('ambulatory').checked;
        
        if (isAmbulatory) {
            // Dacă e ambulatoriu: internare = operație = externare (aceeași zi)
            document.getElementById('surgery-date').value = admissionDate;
            document.getElementById('discharge-date').value = admissionDate;
        } else {
            // Data operației = ziua următoare după internare
            const surgeryDate = new Date(admission);
            surgeryDate.setDate(admission.getDate() + 1);
            document.getElementById('surgery-date').value = surgeryDate.toISOString().split('T')[0];
            
            // Data externării = a 3-a zi după internare
            const dischargeDate = new Date(admission);
            dischargeDate.setDate(admission.getDate() + 3);
            document.getElementById('discharge-date').value = dischargeDate.toISOString().split('T')[0];
        }
    }

    handleAmbulatoryChange(isAmbulatory) {
        const admissionDateInput = document.getElementById('admission-date');
        const surgeryDateInput = document.getElementById('surgery-date');
        const dischargeDateInput = document.getElementById('discharge-date');
        
        if (isAmbulatory) {
            // Dacă e ambulatoriu: toate datele = data internării
            if (admissionDateInput.value) {
                surgeryDateInput.value = admissionDateInput.value;
                dischargeDateInput.value = admissionDateInput.value;
            }
        } else {
            // Dacă nu e ambulatoriu, recalculăm datele normale din data internării
            const admissionDate = admissionDateInput.value;
            if (admissionDate) {
                this.calculateDatesFromAdmission(admissionDate);
            }
        }
    }

    addPatientAndOperation() {
        const form = document.getElementById('combined-form');
        
        const birthDate = document.getElementById('patient-birthdate').value;
        if (!birthDate) {
            alert('Data nașterii este obligatorie.');
            return;
        }

        // Get surgery type (either from dropdown or custom input)
        const surgeryTypeSelect = document.getElementById('surgery-type').value;
        let surgeryType = surgeryTypeSelect;
        if (surgeryTypeSelect === 'custom') {
            const customSurgeryType = document.getElementById('custom-surgery-type').value.trim();
            if (!customSurgeryType) {
                alert('Vă rugăm să introduceți tipul operației personalizate.');
                return;
            }
            surgeryType = customSurgeryType;
        }

        const patient = {
            id: Date.now().toString(),
            name: document.getElementById('patient-name').value,
            phone: document.getElementById('patient-phone').value,
            birthDate: birthDate,
            surgeryType: surgeryType,
            admissionDate: document.getElementById('admission-date').value,
            dischargeDate: document.getElementById('discharge-date').value,
            isAmbulatory: document.getElementById('ambulatory').checked,
            notes: document.getElementById('notes').value,
            dateAdded: new Date().toISOString(),
            status: 'programat'
        };

        const operation = {
            id: (Date.now() + 1).toString(),
            patientId: patient.id,
            datetime: new Date(document.getElementById('surgery-date').value).toISOString(),
            surgeon: document.getElementById('surgeon').value,
            status: 'programata',
            dateScheduled: new Date().toISOString()
        };

        this.patients.push(patient);
        this.operations.push(operation);
        this.saveData();
        this.renderPatients();
        this.renderOperations();
        this.renderCalendar();
        form.reset();
        document.getElementById('patient-age').value = '';
        document.getElementById('custom-surgery-group').style.display = 'none';
        document.getElementById('ambulatory').checked = false;
        
        this.showNotification('Pacient înregistrat și operație programată cu succes!', 'success');
    }


    deletePatient(patientId) {
        if (confirm('Sunteți sigur că doriți să ștergeți acest pacient și operația asociată?')) {
            // Remove patient and associated operation
            this.patients = this.patients.filter(p => p.id !== patientId);
            this.operations = this.operations.filter(op => op.patientId !== patientId);
            this.saveData();
            this.renderPatients();
            this.renderOperations();
            this.renderCalendar();
            this.showNotification('Pacient și operație șterse cu succes!', 'success');
        }
    }

    deleteOperation(operationId) {
        const reason = prompt('Introduceți motivul anulării operației:');
        if (reason === null) {
            // User canceled the prompt
            return;
        }
        
        if (reason.trim() === '') {
            alert('Motivul anulării este obligatoriu.');
            return;
        }

        if (confirm('Sunteți sigur că doriți să anulați această operație?')) {
            const operation = this.operations.find(op => op.id === operationId);
            if (operation) {
                // Store patient details before marking as cancelled
                const patient = this.patients.find(p => p.id === operation.patientId);
                if (patient) {
                    operation.originalPatientData = {
                        name: patient.name,
                        phone: patient.phone,
                        birthDate: patient.birthDate,
                        surgeryType: patient.surgeryType,
                        admissionDate: patient.admissionDate,
                        dischargeDate: patient.dischargeDate,
                        isAmbulatory: patient.isAmbulatory,
                        notes: patient.notes
                    };
                }
                
                // Store cancellation reason
                operation.cancellationReason = reason.trim();
                operation.cancellationDate = new Date().toISOString();
                operation.status = 'anulata';
                
                // Remove patient from active list
                this.patients = this.patients.filter(p => p.id !== operation.patientId);
            }

            this.saveData();
            this.renderOperations();
            this.renderPatients();
            this.renderCalendar();
            this.showNotification(`Operație anulată: ${reason}`, 'success');
        }
    }

    updateOperationStatus(operationId, newStatus) {
        const operation = this.operations.find(op => op.id === operationId);
        if (operation) {
            operation.status = newStatus;
            this.saveData();
            this.renderOperations();
            this.renderCalendar();
            this.showNotification('Status actualizat cu succes!', 'success');
        }
    }

    modifyOperation(operationId) {
        const operation = this.operations.find(op => op.id === operationId);
        if (!operation) return;

        const patient = this.patients.find(p => p.id === operation.patientId);
        if (!patient) {
            alert('Nu s-au găsit datele pacientului.');
            return;
        }

        // Create modification modal
        this.showModificationModal(operation, patient);
    }

    showModificationModal(operation, patient) {
        // Create modal overlay
        const overlay = document.createElement('div');
        overlay.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0,0,0,0.5);
            z-index: 1000;
            display: flex;
            justify-content: center;
            align-items: center;
        `;

        // Create modal content
        const modal = document.createElement('div');
        modal.style.cssText = `
            background: white;
            padding: 2rem;
            border-radius: 8px;
            max-width: 500px;
            width: 90%;
            max-height: 80vh;
            overflow-y: auto;
        `;

        const operationDate = new Date(operation.datetime);

        modal.innerHTML = `
            <h3 style="margin-bottom: 1.5rem; color: #333;">Modifică programarea - ${patient.name}</h3>
            
            <div style="margin-bottom: 1rem;">
                <label style="display: block; margin-bottom: 0.5rem; font-weight: 500;">Data internării:</label>
                <input type="date" id="modify-admission-date" value="${patient.admissionDate}" style="width: 100%; padding: 0.5rem; border: 1px solid #ddd; border-radius: 4px;">
            </div>
            
            <div style="margin-bottom: 1rem;">
                <label style="display: block; margin-bottom: 0.5rem; font-weight: 500;">Data operației:</label>
                <input type="date" id="modify-surgery-date" value="${operationDate.toISOString().split('T')[0]}" style="width: 100%; padding: 0.5rem; border: 1px solid #ddd; border-radius: 4px;">
            </div>
            
            <div style="margin-bottom: 1rem;">
                <label style="display: block; margin-bottom: 0.5rem; font-weight: 500;">Data externării:</label>
                <input type="date" id="modify-discharge-date" value="${patient.dischargeDate}" style="width: 100%; padding: 0.5rem; border: 1px solid #ddd; border-radius: 4px;">
            </div>
            
            <div style="margin-bottom: 1rem;">
                <label style="display: block; margin-bottom: 0.5rem; font-weight: 500;">Chirurg:</label>
                <select id="modify-surgeon" style="width: 100%; padding: 0.5rem; border: 1px solid #ddd; border-radius: 4px;">
                    ${this.surgeons.map(surgeon => 
                        `<option value="${surgeon}" ${surgeon === operation.surgeon ? 'selected' : ''}>${surgeon}</option>`
                    ).join('')}
                </select>
            </div>
            
            <div style="margin-bottom: 1rem;">
                <label style="display: flex; align-items: center; gap: 0.5rem;">
                    <input type="checkbox" id="modify-ambulatory" ${patient.isAmbulatory ? 'checked' : ''} style="transform: scale(1.2);">
                    <span>Ambulatoriu</span>
                </label>
            </div>
            
            <div style="display: flex; gap: 1rem; margin-top: 2rem;">
                <button id="save-modifications" style="flex: 1; padding: 0.75rem; background: #28a745; color: white; border: none; border-radius: 4px; cursor: pointer;">Salvează modificările</button>
                <button id="cancel-modifications" style="flex: 1; padding: 0.75rem; background: #6c757d; color: white; border: none; border-radius: 4px; cursor: pointer;">Anulează</button>
            </div>
        `;

        // Add event listeners for ambulatory checkbox
        modal.querySelector('#modify-ambulatory').addEventListener('change', (e) => {
            this.handleModifyAmbulatoryChange(e.target.checked);
        });

        // Add event listener for admission date change
        modal.querySelector('#modify-admission-date').addEventListener('change', (e) => {
            this.handleModifyAdmissionDateChange(e.target.value);
        });

        // Save button event
        modal.querySelector('#save-modifications').onclick = () => {
            this.saveOperationModifications(operation, patient, overlay);
        };

        // Cancel button event
        modal.querySelector('#cancel-modifications').onclick = () => {
            document.body.removeChild(overlay);
        };

        overlay.appendChild(modal);
        document.body.appendChild(overlay);
    }

    handleModifyAmbulatoryChange(isAmbulatory) {
        const admissionInput = document.getElementById('modify-admission-date');
        const surgeryInput = document.getElementById('modify-surgery-date');
        const dischargeInput = document.getElementById('modify-discharge-date');
        
        if (isAmbulatory && admissionInput.value) {
            surgeryInput.value = admissionInput.value;
            dischargeInput.value = admissionInput.value;
        } else if (!isAmbulatory && admissionInput.value) {
            this.handleModifyAdmissionDateChange(admissionInput.value);
        }
    }

    handleModifyAdmissionDateChange(admissionDate) {
        const isAmbulatory = document.getElementById('modify-ambulatory').checked;
        const surgeryInput = document.getElementById('modify-surgery-date');
        const dischargeInput = document.getElementById('modify-discharge-date');
        
        if (isAmbulatory) {
            surgeryInput.value = admissionDate;
            dischargeInput.value = admissionDate;
        } else {
            const admission = new Date(admissionDate);
            const surgeryDate = new Date(admission);
            surgeryDate.setDate(admission.getDate() + 1);
            const dischargeDate = new Date(admission);
            dischargeDate.setDate(admission.getDate() + 3);
            
            surgeryInput.value = surgeryDate.toISOString().split('T')[0];
            dischargeInput.value = dischargeDate.toISOString().split('T')[0];
        }
    }

    saveOperationModifications(operation, patient, overlay) {
        // Get modified values
        const newAdmissionDate = document.getElementById('modify-admission-date').value;
        const newSurgeryDate = document.getElementById('modify-surgery-date').value;
        const newDischargeDate = document.getElementById('modify-discharge-date').value;
        const newSurgeon = document.getElementById('modify-surgeon').value;
        const newIsAmbulatory = document.getElementById('modify-ambulatory').checked;

        if (!newAdmissionDate || !newSurgeryDate || !newDischargeDate || !newSurgeon) {
            alert('Toate câmpurile sunt obligatorii.');
            return;
        }

        // Update patient data
        patient.admissionDate = newAdmissionDate;
        patient.dischargeDate = newDischargeDate;
        patient.isAmbulatory = newIsAmbulatory;

        // Update operation data
        operation.datetime = new Date(newSurgeryDate).toISOString();
        operation.surgeon = newSurgeon;

        // Save and refresh
        this.saveData();
        this.renderPatients();
        this.renderOperations();
        this.renderCalendar();
        
        // Close modal
        document.body.removeChild(overlay);
        
        this.showNotification('Programarea a fost modificată cu succes!', 'success');
    }

    rescheduleOperation(operationId) {
        const operation = this.operations.find(op => op.id === operationId);
        if (!operation) return;

        // Create date picker modal
        this.showDatePickerModal((selectedDate) => {
            const newSurgeon = prompt('Introduceți chirurgul pentru noua programare:', operation.surgeon);
            if (newSurgeon === null) return;
            
            if (newSurgeon.trim() === '') {
                alert('Chirurgul este obligatoriu.');
                return;
            }

            // Use preserved patient data from cancellation
            const patientData = operation.originalPatientData;
            if (!patientData) {
                alert('Nu s-au găsit datele pacientului.');
                return;
            }

            // Create new patient entry with preserved data
            const newPatient = {
                id: Date.now().toString(),
                name: patientData.name,
                phone: patientData.phone,
                birthDate: patientData.birthDate,
                surgeryType: patientData.surgeryType,
                admissionDate: patientData.admissionDate,
                dischargeDate: patientData.dischargeDate,
                isAmbulatory: patientData.isAmbulatory,
                notes: patientData.notes + ` | Reprogramat din ${this.formatDate(new Date(operation.datetime))}`,
                dateAdded: new Date().toISOString(),
                status: 'programat'
            };

            // Update operation
            operation.datetime = selectedDate.toISOString();
            operation.surgeon = newSurgeon.trim();
            operation.status = 'programata';
            operation.patientId = newPatient.id;
            operation.rescheduleDate = new Date().toISOString();
            
            // Add the new patient
            this.patients.push(newPatient);
            
            this.saveData();
            this.renderOperations();
            this.renderPatients();
            this.renderCalendar();
            this.showNotification('Operație reprogramată cu succes!', 'success');
        });
    }

    renderPatients() {
        const container = document.getElementById('patients-container');
        container.innerHTML = '';

        if (this.patients.length === 0) {
            container.innerHTML = '<p class="text-muted">Nu există pacienți înregistrați.</p>';
            return;
        }

        this.patients.forEach(patient => {
            const patientCard = document.createElement('div');
            patientCard.className = 'patient-card';
            patientCard.innerHTML = `
                <div class="patient-info">
                    <div>
                        <strong>Nume:</strong>
                        <span>${patient.name}</span>
                    </div>
                    <div>
                        <strong>Telefon:</strong>
                        <span>${patient.phone}</span>
                    </div>
                    <div>
                        <strong>Data nașterii:</strong>
                        <span>${patient.birthDate ? this.formatDate(new Date(patient.birthDate)) : 'N/A'}</span>
                    </div>
                    <div>
                        <strong>Tip operație:</strong>
                        <span>${this.getSurgeryTypeLabel(patient.surgeryType)}</span>
                    </div>
                    <div>
                        <strong>Data internării:</strong>
                        <span>${patient.admissionDate ? this.formatDate(new Date(patient.admissionDate)) : 'N/A'}</span>
                    </div>
                    <div>
                        <strong>Data externării:</strong>
                        <span>${patient.dischargeDate ? this.formatDate(new Date(patient.dischargeDate)) : 'N/A'}</span>
                    </div>
                    ${patient.isAmbulatory ? '<div><strong>Tip:</strong> <span class="ambulatory-badge">Ambulatoriu</span></div>' : ''}
                </div>
                ${patient.notes ? `<div><strong>Observații:</strong> ${patient.notes}</div>` : ''}
                <div>
                    <strong>Status:</strong>
                    <span class="status ${patient.status}">${this.getStatusLabel(patient.status)}</span>
                </div>
                <div class="patient-actions">
                    <button class="btn btn-small btn-delete" onclick="opplan.deletePatient('${patient.id}')">Șterge</button>
                </div>
            `;
            container.appendChild(patientCard);
        });
    }

    renderOperations() {
        const container = document.getElementById('scheduled-container');
        container.innerHTML = '';

        if (this.operations.length === 0) {
            container.innerHTML = '<p class="text-muted">Nu există operații programate.</p>';
            return;
        }

        // Sort operations by date
        const sortedOperations = [...this.operations].sort((a, b) => new Date(a.datetime) - new Date(b.datetime));

        sortedOperations.forEach(operation => {
            const patient = this.patients.find(p => p.id === operation.patientId);
            const operationDate = new Date(operation.datetime);
            
            const operationCard = document.createElement('div');
            operationCard.className = 'operation-card';
            operationCard.innerHTML = `
                <div class="patient-info">
                    <div>
                        <strong>Pacient:</strong>
                        <span>${patient ? patient.name : 'Pacient necunoscut'}</span>
                    </div>
                    <div>
                        <strong>Data:</strong>
                        <span>${this.formatDate(operationDate)}</span>
                    </div>
                    <div>
                        <strong>Chirurg:</strong>
                        <span>${operation.surgeon}</span>
                    </div>
                    <div>
                        <strong>Tip operație:</strong>
                        <span>${patient ? this.getSurgeryTypeLabel(patient.surgeryType) : 'N/A'}</span>
                    </div>
                </div>
                <div>
                    <strong>Status:</strong>
                    <span class="status ${operation.status}">${this.getOperationStatusLabel(operation.status)}</span>
                </div>
                ${operation.status === 'anulata' && operation.cancellationReason ? `
                    <div>
                        <strong>Motiv anulare:</strong>
                        <span>${operation.cancellationReason}</span>
                    </div>
                    <div>
                        <strong>Data anulării:</strong>
                        <span>${this.formatDate(new Date(operation.cancellationDate))}</span>
                    </div>
                ` : ''}
                <div class="operation-actions">
                    ${operation.status === 'programata' ? `
                        <button class="btn btn-small btn-edit" onclick="opplan.modifyOperation('${operation.id}')">Modifică programarea</button>
                        <button class="btn btn-small btn-delete" onclick="opplan.deleteOperation('${operation.id}')">Anulează</button>
                    ` : ''}
                    ${operation.status === 'in-progress' ? `
                        <button class="btn btn-small" onclick="opplan.updateOperationStatus('${operation.id}', 'finalizata')">Finalizează</button>
                        <button class="btn btn-small btn-delete" onclick="opplan.deleteOperation('${operation.id}')">Anulează</button>
                    ` : ''}
                    ${operation.status === 'anulata' ? `
                        <button class="btn btn-small btn-schedule" onclick="opplan.rescheduleOperation('${operation.id}')">Reprogramează</button>
                    ` : ''}
                </div>
            `;
            container.appendChild(operationCard);
        });
    }

    renderCalendar() {
        const grid = document.getElementById('calendar-grid');
        const monthElement = document.getElementById('current-month');
        
        // Debug: verifică pacienții existenți
        console.log('=== RENDER CALENDAR ===');
        console.log('Numărul de pacienți:', this.patients.length);
        this.patients.forEach((patient, index) => {
            console.log(`Pacient ${index + 1}:`, {
                name: patient.name,
                admissionDate: patient.admissionDate,
                dischargeDate: patient.dischargeDate,
                isAmbulatory: patient.isAmbulatory
            });
        });
        
        // Clear previous calendar
        grid.innerHTML = '';
        
        const year = this.currentDate.getFullYear();
        const month = this.currentDate.getMonth();
        
        // Set month header
        monthElement.textContent = this.currentDate.toLocaleDateString('ro-RO', { month: 'long', year: 'numeric' });
        
        // Add day headers
        const dayHeaders = ['Lun', 'Mar', 'Mie', 'Joi', 'Vin', 'Sâm', 'Dum'];
        dayHeaders.forEach(day => {
            const dayHeader = document.createElement('div');
            dayHeader.className = 'calendar-day-header';
            dayHeader.style.cssText = 'background: #667eea; color: white; padding: 0.5rem; text-align: center; font-weight: bold;';
            dayHeader.textContent = day;
            grid.appendChild(dayHeader);
        });
        
        // Get first day of month and number of days
        const firstDay = new Date(year, month, 1);
        const lastDay = new Date(year, month + 1, 0);
        const startDate = new Date(firstDay);
        startDate.setDate(startDate.getDate() - (firstDay.getDay() === 0 ? 6 : firstDay.getDay() - 1));
        
        // Generate calendar days
        const today = new Date();
        for (let i = 0; i < 42; i++) {
            const currentDay = new Date(startDate);
            currentDay.setDate(startDate.getDate() + i);
            
            const dayElement = document.createElement('div');
            dayElement.className = 'calendar-day';
            
            if (currentDay.getMonth() !== month) {
                dayElement.classList.add('other-month');
            }
            
            if (currentDay.toDateString() === today.toDateString()) {
                dayElement.classList.add('today');
            }
            
            const dayNumber = document.createElement('div');
            dayNumber.className = 'day-number';
            dayNumber.textContent = currentDay.getDate();
            dayElement.appendChild(dayNumber);
            
            // Check for patient stays and apply colors + show patient
            this.patients.forEach(patient => {
                if (!patient.admissionDate || !patient.dischargeDate) {
                    console.log(`Pacient ${patient.name} sărit - lipsesc date:`, {
                        admissionDate: patient.admissionDate,
                        dischargeDate: patient.dischargeDate
                    });
                    return;
                }
                
                const admissionDate = new Date(patient.admissionDate);
                const dischargeDate = new Date(patient.dischargeDate);
                const surgeryOperation = this.operations.find(op => op.patientId === patient.id);
                
                // Debug detaliat pentru compararea datelor
                console.log(`=== PACIENT: ${patient.name} ===`);
                console.log('Data curentă din calendar:', currentDay.toDateString());
                console.log('Data internării din formular:', patient.admissionDate);
                console.log('Data internării ca Date object:', admissionDate.toDateString());
                console.log('Sunt egale?:', currentDay.toDateString() === admissionDate.toDateString());
                
                
                // Verifică direct dacă ziua curentă este ziua de internare
                let dayType = null;
                let shouldShowPatient = false;
                
                // PRIORITATE 1: Verifică ziua de internare (ALBASTRU)
                if (currentDay.toDateString() === admissionDate.toDateString()) {
                    dayElement.classList.add('admission-day');
                    this.addDayTypeIndicator(dayElement, 'admission');
                    dayType = patient.isAmbulatory ? 'Ambulatoriu' : 'Internare';
                    shouldShowPatient = true;
                    console.log(`✅ INTERNARE DETECTATĂ: ${patient.name} în ${currentDay.toDateString()}`);
                }
                // PRIORITATE 2: Verifică ziua de operație (ROȘU)
                else if (surgeryOperation && currentDay.toDateString() === new Date(surgeryOperation.datetime).toDateString()) {
                    dayElement.classList.add('surgery-day');
                    this.addDayTypeIndicator(dayElement, 'surgery');
                    dayType = 'Operație';
                    shouldShowPatient = true;
                }
                // PRIORITATE 3: Verifică ziua de externare (VERDE)
                else if (currentDay.toDateString() === dischargeDate.toDateString()) {
                    dayElement.classList.add('discharge-day');
                    this.addDayTypeIndicator(dayElement, 'discharge');
                    dayType = 'Externare';
                    shouldShowPatient = true;
                }
                // PRIORITATE 4: Verifică zilele staționate (GALBEN)
                else if (currentDay > admissionDate && currentDay < dischargeDate) {
                    dayElement.classList.add('stationary-day');
                    this.addDayTypeIndicator(dayElement, 'stationary');
                    dayType = 'Staționar';
                    shouldShowPatient = true;
                }
                
                // Adaugă pacientul în calendar pentru zilele relevante
                if (shouldShowPatient) {
                    const patientElement = document.createElement('div');
                    patientElement.className = 'calendar-patient';
                    patientElement.textContent = patient.name;
                    patientElement.title = `${patient.name} - ${dayType}${surgeryOperation && surgeryOperation.surgeon ? ' - ' + surgeryOperation.surgeon : ''}`;
                    dayElement.appendChild(patientElement);
                    console.log(`AFIȘAT în calendar: ${patient.name} - ${dayType} în ziua ${currentDay.toDateString()}`);
                } else {
                    console.log(`NU AFIȘAT: ${patient.name} - shouldShowPatient: ${shouldShowPatient}`);
                }
                
            });
            
            grid.appendChild(dayElement);
        }
    }

    searchPatients(query) {
        const patients = document.querySelectorAll('.patient-card');
        patients.forEach(card => {
            const text = card.textContent.toLowerCase();
            if (text.includes(query.toLowerCase())) {
                card.style.display = 'block';
            } else {
                card.style.display = 'none';
            }
        });
    }


    saveData() {
        localStorage.setItem('patients', JSON.stringify(this.patients));
        localStorage.setItem('operations', JSON.stringify(this.operations));
        localStorage.setItem('surgeryTypes', JSON.stringify(this.surgeryTypes));
        localStorage.setItem('surgeons', JSON.stringify(this.surgeons));
    }

    showNotification(message, type) {
        // Simple notification system
        const notification = document.createElement('div');
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 1rem 2rem;
            background: ${type === 'success' ? '#28a745' : '#dc3545'};
            color: white;
            border-radius: 4px;
            z-index: 1000;
            box-shadow: 0 4px 8px rgba(0,0,0,0.2);
        `;
        notification.textContent = message;
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.remove();
        }, 3000);
    }

    showDatePickerModal(callback) {
        // Create modal overlay
        const overlay = document.createElement('div');
        overlay.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0,0,0,0.5);
            z-index: 1000;
            display: flex;
            justify-content: center;
            align-items: center;
        `;

        // Create modal content
        const modal = document.createElement('div');
        modal.style.cssText = `
            background: white;
            padding: 2rem;
            border-radius: 8px;
            max-width: 400px;
            width: 90%;
        `;

        const title = document.createElement('h3');
        title.textContent = 'Selectați data operației';
        title.style.marginBottom = '1rem';
        modal.appendChild(title);

        // Create mini calendar
        const calendarContainer = document.createElement('div');
        const currentDate = new Date();
        this.renderDatePicker(calendarContainer, currentDate, (date) => {
            document.body.removeChild(overlay);
            callback(date);
        });
        modal.appendChild(calendarContainer);

        // Cancel button
        const cancelBtn = document.createElement('button');
        cancelBtn.textContent = 'Anulează';
        cancelBtn.style.cssText = 'margin-top: 1rem; padding: 0.5rem 1rem; background: #ccc; border: none; border-radius: 4px; cursor: pointer;';
        cancelBtn.onclick = () => document.body.removeChild(overlay);
        modal.appendChild(cancelBtn);

        overlay.appendChild(modal);
        document.body.appendChild(overlay);
    }

    renderDatePicker(container, currentDate, onDateSelect) {
        container.innerHTML = '';
        
        // Navigation
        const nav = document.createElement('div');
        nav.style.cssText = 'display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem;';
        
        const prevBtn = document.createElement('button');
        prevBtn.textContent = '‹';
        prevBtn.style.cssText = 'border: none; background: #667eea; color: white; padding: 0.5rem; border-radius: 4px; cursor: pointer;';
        prevBtn.onclick = () => {
            currentDate.setMonth(currentDate.getMonth() - 1);
            this.renderDatePicker(container, currentDate, onDateSelect);
        };
        
        const nextBtn = document.createElement('button');
        nextBtn.textContent = '›';
        nextBtn.style.cssText = 'border: none; background: #667eea; color: white; padding: 0.5rem; border-radius: 4px; cursor: pointer;';
        nextBtn.onclick = () => {
            currentDate.setMonth(currentDate.getMonth() + 1);
            this.renderDatePicker(container, currentDate, onDateSelect);
        };
        
        const monthLabel = document.createElement('span');
        monthLabel.textContent = currentDate.toLocaleDateString('ro-RO', { month: 'long', year: 'numeric' });
        monthLabel.style.fontWeight = 'bold';
        
        nav.appendChild(prevBtn);
        nav.appendChild(monthLabel);
        nav.appendChild(nextBtn);
        container.appendChild(nav);
        
        // Calendar grid
        const grid = document.createElement('div');
        grid.style.cssText = 'display: grid; grid-template-columns: repeat(7, 1fr); gap: 2px; text-align: center;';
        
        // Day headers
        const dayHeaders = ['Lu', 'Ma', 'Mi', 'Jo', 'Vi', 'Sâ', 'Du'];
        dayHeaders.forEach(day => {
            const header = document.createElement('div');
            header.textContent = day;
            header.style.cssText = 'padding: 0.5rem; font-weight: bold; background: #f0f0f0;';
            grid.appendChild(header);
        });
        
        // Generate days
        const firstDay = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
        const lastDay = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
        const startDate = new Date(firstDay);
        startDate.setDate(startDate.getDate() - (firstDay.getDay() === 0 ? 6 : firstDay.getDay() - 1));
        
        const today = new Date();
        for (let i = 0; i < 42; i++) {
            const day = new Date(startDate);
            day.setDate(startDate.getDate() + i);
            
            const dayEl = document.createElement('div');
            dayEl.textContent = day.getDate();
            dayEl.style.cssText = 'padding: 0.5rem; cursor: pointer; border-radius: 4px;';
            
            if (day.getMonth() !== currentDate.getMonth()) {
                dayEl.style.color = '#ccc';
            } else if (day < today) {
                dayEl.style.color = '#ccc';
                dayEl.style.cursor = 'not-allowed';
            } else {
                // Check if it's Tuesday or Thursday
                const dayOfWeek = day.getDay();
                if (dayOfWeek === 2 || dayOfWeek === 4) {
                    dayEl.style.backgroundColor = '#e8f5e8';
                }
                
                dayEl.style.backgroundColor = dayEl.style.backgroundColor || '#f8f9fa';
                dayEl.onmouseover = () => dayEl.style.backgroundColor = '#667eea';
                dayEl.onmouseout = () => {
                    const dayOfWeek = day.getDay();
                    dayEl.style.backgroundColor = (dayOfWeek === 2 || dayOfWeek === 4) ? '#e8f5e8' : '#f8f9fa';
                };
                dayEl.onclick = () => {
                    if (day >= today) {
                        onDateSelect(day);
                    }
                };
            }
            
            grid.appendChild(dayEl);
        }
        
        container.appendChild(grid);
    }

    addDayTypeIndicator(dayElement, type) {
        // Verifică dacă există deja un indicator pentru a evita duplicatele
        if (dayElement.querySelector('.day-type-indicator')) return;
        
        const indicator = document.createElement('div');
        indicator.className = `day-type-indicator ${type}`;
        dayElement.appendChild(indicator);
    }

    formatDate(date) {
        const day = date.getDate().toString().padStart(2, '0');
        const month = (date.getMonth() + 1).toString().padStart(2, '0');
        const year = date.getFullYear();
        return `${day}.${month}.${year}`;
    }

    updateFormOptions() {
        // Update surgery types dropdown
        const surgerySelect = document.getElementById('surgery-type');
        surgerySelect.innerHTML = '<option value="">Selectează...</option>';
        this.surgeryTypes.forEach(type => {
            const option = document.createElement('option');
            option.value = type.id;
            option.textContent = type.name;
            surgerySelect.appendChild(option);
        });

        // Update surgeons dropdown
        const surgeonSelect = document.getElementById('surgeon');
        surgeonSelect.innerHTML = '<option value="">Selectează chirurg...</option>';
        this.surgeons.forEach(surgeon => {
            const option = document.createElement('option');
            option.value = surgeon;
            option.textContent = surgeon;
            surgeonSelect.appendChild(option);
        });
    }

    showSettings() {
        // Create modal overlay
        const overlay = document.createElement('div');
        overlay.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0,0,0,0.5);
            z-index: 1000;
            display: flex;
            justify-content: center;
            align-items: center;
        `;

        // Create modal content
        const modal = document.createElement('div');
        modal.style.cssText = `
            background: white;
            padding: 2rem;
            border-radius: 8px;
            max-width: 600px;
            width: 90%;
            max-height: 80vh;
            overflow-y: auto;
        `;

        const title = document.createElement('h2');
        title.textContent = 'Setări';
        title.style.marginBottom = '2rem';
        modal.appendChild(title);

        // Surgery Types Section
        const surgerySection = document.createElement('div');
        surgerySection.innerHTML = `
            <h3 style="margin-bottom: 1rem;">Tipuri de Operații</h3>
            <div style="margin-bottom: 1rem;">
                <input type="text" id="new-surgery-type" placeholder="Nume tip operație" style="padding: 0.5rem; border: 1px solid #ddd; border-radius: 4px; margin-right: 0.5rem;">
                <button onclick="opplan.addSurgeryType()" style="padding: 0.5rem 1rem; background: #28a745; color: white; border: none; border-radius: 4px; cursor: pointer;">Adaugă</button>
            </div>
            <div id="surgery-types-list" style="margin-bottom: 2rem;"></div>
        `;
        modal.appendChild(surgerySection);

        // Surgeons Section
        const surgeonSection = document.createElement('div');
        surgeonSection.innerHTML = `
            <h3 style="margin-bottom: 1rem;">Chirurgi Principali</h3>
            <div style="margin-bottom: 1rem;">
                <input type="text" id="new-surgeon" placeholder="Nume chirurg" style="padding: 0.5rem; border: 1px solid #ddd; border-radius: 4px; margin-right: 0.5rem;">
                <button onclick="opplan.addSurgeon()" style="padding: 0.5rem 1rem; background: #28a745; color: white; border: none; border-radius: 4px; cursor: pointer;">Adaugă</button>
            </div>
            <div id="surgeons-list" style="margin-bottom: 2rem;"></div>
        `;
        modal.appendChild(surgeonSection);

        // Close button
        const closeBtn = document.createElement('button');
        closeBtn.textContent = 'Închide';
        closeBtn.style.cssText = 'padding: 0.75rem 2rem; background: #667eea; color: white; border: none; border-radius: 4px; cursor: pointer; width: 100%;';
        closeBtn.onclick = () => {
            document.body.removeChild(overlay);
            this.updateFormOptions();
        };
        modal.appendChild(closeBtn);

        overlay.appendChild(modal);
        document.body.appendChild(overlay);

        // Render current lists
        this.renderSurgeryTypesList();
        this.renderSurgeonsList();
    }

    renderSurgeryTypesList() {
        const container = document.getElementById('surgery-types-list');
        if (!container) return;
        
        container.innerHTML = '';
        this.surgeryTypes.forEach(type => {
            const item = document.createElement('div');
            item.style.cssText = 'display: flex; justify-content: space-between; align-items: center; padding: 0.5rem; border: 1px solid #eee; margin-bottom: 0.5rem; border-radius: 4px;';
            item.innerHTML = `
                <span>${type.name}</span>
                <button onclick="opplan.removeSurgeryType('${type.id}')" style="background: #dc3545; color: white; border: none; padding: 0.25rem 0.5rem; border-radius: 4px; cursor: pointer;">Șterge</button>
            `;
            container.appendChild(item);
        });
    }

    renderSurgeonsList() {
        const container = document.getElementById('surgeons-list');
        if (!container) return;
        
        container.innerHTML = '';
        this.surgeons.forEach((surgeon, index) => {
            const item = document.createElement('div');
            item.style.cssText = 'display: flex; justify-content: space-between; align-items: center; padding: 0.5rem; border: 1px solid #eee; margin-bottom: 0.5rem; border-radius: 4px;';
            item.innerHTML = `
                <span>${surgeon}</span>
                <button onclick="opplan.removeSurgeon(${index})" style="background: #dc3545; color: white; border: none; padding: 0.25rem 0.5rem; border-radius: 4px; cursor: pointer;">Șterge</button>
            `;
            container.appendChild(item);
        });
    }

    addSurgeryType() {
        const input = document.getElementById('new-surgery-type');
        const name = input.value.trim();
        
        if (name === '') {
            alert('Introduceți numele tipului de operație.');
            return;
        }

        // Check if already exists
        if (this.surgeryTypes.some(type => type.name.toLowerCase() === name.toLowerCase())) {
            alert('Acest tip de operație există deja.');
            return;
        }

        const id = name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
        this.surgeryTypes.push({id, name});
        this.saveData();
        input.value = '';
        this.renderSurgeryTypesList();
    }

    removeSurgeryType(id) {
        if (confirm('Sunteți sigur că doriți să ștergeți acest tip de operație?')) {
            this.surgeryTypes = this.surgeryTypes.filter(type => type.id !== id);
            this.saveData();
            this.renderSurgeryTypesList();
        }
    }

    addSurgeon() {
        const input = document.getElementById('new-surgeon');
        const name = input.value.trim();
        
        if (name === '') {
            alert('Introduceți numele chirurgului.');
            return;
        }

        // Check if already exists
        if (this.surgeons.some(surgeon => surgeon.toLowerCase() === name.toLowerCase())) {
            alert('Acest chirurg există deja în listă.');
            return;
        }

        this.surgeons.push(name);
        this.saveData();
        input.value = '';
        this.renderSurgeonsList();
    }

    removeSurgeon(index) {
        if (confirm('Sunteți sigur că doriți să ștergeți acest chirurg?')) {
            this.surgeons.splice(index, 1);
            this.saveData();
            this.renderSurgeonsList();
        }
    }

    togglePatientsList() {
        const content = document.getElementById('patients-content');
        const toggleBtn = document.getElementById('patients-toggle');
        
        if (content.style.display === 'none') {
            content.style.display = 'block';
            content.classList.add('expanded');
            toggleBtn.classList.add('expanded');
        } else {
            content.style.display = 'none';
            content.classList.remove('expanded');
            toggleBtn.classList.remove('expanded');
        }
    }

    // Helper methods for labels
    getSurgeryTypeLabel(type) {
        const types = {
            'appendicita': 'Apendicită',
            'colecistectomie': 'Colecistectomie',
            'hernie': 'Hernie',
            'cardio': 'Chirurgie Cardio',
            'ortopedica': 'Chirurgie Ortopedică',
            'plastica': 'Chirurgie Plastică',
            'alta': 'Altă operație'
        };
        // Return the label from the predefined types, or the custom type as-is
        return types[type] || type;
    }


    getStatusLabel(status) {
        const statuses = {
            'programat': 'Programat'
        };
        return statuses[status] || status;
    }

    getOperationStatusLabel(status) {
        const statuses = {
            'programata': 'Programată',
            'in-progress': 'În desfășurare',
            'finalizata': 'Finalizată',
            'anulata': 'Anulată'
        };
        return statuses[status] || status;
    }

}

// Tab functionality
function showTab(tabName) {
    // Hide all tabs
    document.querySelectorAll('.tab-content').forEach(tab => {
        tab.classList.remove('active');
    });
    
    // Remove active class from all buttons
    document.querySelectorAll('.tab-button').forEach(button => {
        button.classList.remove('active');
    });
    
    // Show selected tab
    document.getElementById(tabName + '-tab').classList.add('active');
    
    // Add active class to clicked button
    event.target.classList.add('active');
}

// Calendar navigation
function previousMonth() {
    opplan.currentDate.setMonth(opplan.currentDate.getMonth() - 1);
    opplan.renderCalendar();
}

function nextMonth() {
    opplan.currentDate.setMonth(opplan.currentDate.getMonth() + 1);
    opplan.renderCalendar();
}

// Initialize the application
const opplan = new OPPlan();