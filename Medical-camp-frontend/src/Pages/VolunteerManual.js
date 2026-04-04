import '../Styles/VolunteerManual.css';

const VolunteerManual = () => {
    return (
        <div className="manual-container">
            <h1 className="manual-title">Volunteer User Manual</h1>
            <p className="manual-intro">
                Welcome to the Medical Camp Web App! This manual is designed to guide you through the camp workflow and the specific features available on your dashboard.
            </p>

            {/* 1. Camp Workflow Section */}
            <div className="manual-section">
                <h2>1. Camp Workflow</h2>
                <p>This is the standard flow for a patient visiting the medical camp:</p>
                <div className="workflow-diagram">
                    <div className="workflow-step">1. Patient Registration</div>
                    <div className="workflow-arrow">⬇</div>
                    <div className="workflow-step">2. Doctor Assigning</div>
                    <div className="workflow-arrow">⬇</div>
                    <div className="workflow-step">3. Vitals Recording</div>
                    <div className="workflow-arrow">⬇</div>
                    <div className="workflow-step">4. Doctor Consultation (Prescription)</div>
                    <div className="workflow-arrow">⬇</div>
                    <div className="workflow-step">5. Stock Update</div>
                    <div className="workflow-arrow">⬇</div>
                    <div className="workflow-step">6. Counselling (if required)</div>
                    <div className="workflow-arrow">⬇</div>
                    <div className="workflow-step">7. Food Distribution</div>
                </div>
            </div>

            {/* 2. Dashboard Modules Instructions */}
            <div className="manual-section">
                <h2>2. Dashboard Modules & Instructions</h2>
                <p>Select the corresponding card on your dashboard to perform these actions.</p>

                {/* Card 1: Patient Registration */}
                <div className="manual-card-guide">
                    <h3>1. Patient Registration</h3>
                    <div className="card-content">
                        <p><strong>Purpose:</strong> The entry point for every patient. Register new patients or update existing ones.</p>
                        <p><strong>Procedure:</strong></p>
                        <ol>
                            <li>Ask for the <strong>Book Number</strong> (from the physical token/book).</li>
                            <li>Enter it into the search field.</li>
                            <li><strong>If Patient Exists:</strong> Their details will load. Verify and update if necessary.</li>
                            <li><strong>If New Patient:</strong> Fill in the required details:
                                <ul>
                                    <li><strong>Name</strong> (Letters and spaces only)</li>
                                    <li><strong>Age</strong> (0.1 - 120)</li>
                                    <li><strong>Gender</strong></li>
                                    <li><strong>Phone Number</strong> (10 digits)</li>
                                    <li><strong>Area</strong> (Select from suggestions or type new)</li>
                                </ul>
                            </li>
                            <li>Click <strong>Save</strong>. A Patient ID Card will appear upon success.</li>
                        </ol>
                    </div>
                </div>

                {/* Card 2: Doctor Assigning */}
                <div className="manual-card-guide">
                    <h3>2. Doctor Assigning</h3>
                    <div className="card-content">
                        <p><strong>Purpose:</strong> Assign a registered patient to an available doctor.</p>
                        <p><strong>Procedure:</strong></p>
                        <ol>
                            <li>You will see a list of patients waiting for assignment.</li>
                            <li>Enter Patient Book Number and select a doctor from the dropdown.</li>
                            <li>Confirm the assignment. The patient now moves to the Vitals stage.</li>
                        </ol>
                    </div>
                </div>

                {/* Card 3: Vitals */}
                <div className="manual-card-guide">
                    <h3>3. Vitals</h3>
                    <div className="card-content">
                        <p><strong>Purpose:</strong> Record basic health metrics before the doctor sees the patient.</p>
                        <p><strong>Prerequisite:</strong> Patient must have a doctor assigned.</p>
                        <p><strong>Procedure:</strong></p>
                        <ol>
                            <li>Enter the <strong>Book Number</strong>.</li>
                            <li>If no doctor is assigned, the system will prompt you to assign one first.</li>
                            <li>Enter the Vitals:
                                <ul>
                                    <li><strong>BP (Blood Pressure)</strong> (e.g., 120/80)</li>
                                    <li><strong>Pulse</strong> (bpm)</li>
                                    <li><strong>Height</strong> (cm) & <strong>Weight</strong> (kg)</li>
                                    <li><strong>RBS</strong> (Random Blood Sugar) if applicable.</li>
                                    <li><strong>Last Meal and Time</strong> (Optional note)</li>
                                </ul>
                            </li>
                            <li>Click <strong>Submit</strong>.</li>
                        </ol>
                    </div>
                </div>

                {/* Card 4: Doctor Prescription */}
                <div className="manual-card-guide">
                    <h3>4. Doctor Prescription</h3>
                    <div className="card-content">
                        <p><strong>Purpose:</strong> For doctors or scribes to digitally record the medication.</p>
                        <p><strong>Procedure:</strong></p>
                        <ol>
                            <li>Enter the <strong>Book Number</strong>.</li>
                            <li>Assign Medicines:
                                <ul>
                                    <li>Enter <strong>Medicine ID</strong> (e.g., 101).</li>
                                    <li><strong>By Dosing Schedule:</strong> Select Days and Schedule (Morning/Afternoon/Night).</li>
                                    <li><strong>By Quantity:</strong> Enter the total quantity directly.</li>
                                </ul>
                            </li>
                            <li>Click <strong>Submit Prescription</strong>.</li>
                        </ol>
                    </div>
                </div>

                {/* Card 5: Medicine Packing */}
                <div className="manual-card-guide">
                    <h3>5. Medicine Entry</h3>
                    <div className="card-content">
                        <p><strong>Purpose:</strong> Pharmacy volunteers view the prescription and dispense meds.</p>
                        <p><strong>Procedure:</strong></p>
                        <ol>
                            <li>Enter the <strong>Book Number</strong>.</li>
                            <li>The digital prescription will be displayed.</li>
                            <li>Pick the medicines from the stock.</li>
                            <li>Check the box next to each medicine as you pack it.</li>
                            <li>Click <strong>Confirm Pickup</strong> to update the inventory.</li>
                        </ol>
                    </div>
                </div>

                {/* Card 6: Counselling */}
                <div className="manual-card-guide">
                    <h3>6. Counselling</h3>
                    <div className="card-content">
                        <p><strong>Purpose:</strong> Mark the patient as counselled.</p>
                        <p><strong>Procedure:</strong></p>
                        <ol>
                            <li>Enter the <strong>Book Number</strong>.</li>
                            <li>Click <strong>Mark as Counselled</strong>.</li>
                        </ol>
                    </div>
                </div>

                {/* Card 7: Food */}
                <div className="manual-card-guide">
                    <h3>7. Food</h3>
                    <div className="card-content">
                        <p><strong>Purpose:</strong> Manage food distribution to patients.</p>
                        <p><strong>Procedure:</strong></p>
                        <ol>
                            <li>Enter the <strong>Book Number</strong>.</li>
                            <li>The system checks if the patient has already received food.</li>
                            <li>If not, click <strong>Mark as Distributed</strong>.</li>
                            <li>Hand over the food packet.</li>
                        </ol>
                    </div>
                </div>
            </div>

            <div className="manual-footer">
                <h3>Need Help?</h3>
                <p>If you encounter any technical issues, please contact the <strong>Camp Administrator</strong>.</p>
            </div>
        </div>
    );
};

export default VolunteerManual;
