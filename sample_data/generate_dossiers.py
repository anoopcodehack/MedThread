"""
MedThread Synthetic Patient Dossier Generator
Generates 25 clinical documents across 5 test patients with planted test cases
for the SOSC SYNERGY 26 benchmark suite.
"""

import os
from pathlib import Path

def create_simple_pdf(filepath: Path, title: str, content: str):
    """
    Creates a valid minimal PDF-1.4 document using pure Python standard library.
    No external pip packages required.
    """
    escaped_title = title.replace("\\", "\\\\").replace("(", "\\(").replace(")", "\\)")
    lines = content.strip().split("\n")
    
    text_commands = [
        "BT",
        "/F1 16 Tf",
        "50 750 Td",
        f"({escaped_title}) Tj",
        "/F1 10 Tf",
        "0 -25 Td"
    ]
    
    y_offset = 0
    for line in lines:
        escaped_line = line.replace("\\", "\\\\").replace("(", "\\(").replace(")", "\\)")
        if not escaped_line.strip():
            text_commands.append("0 -15 Td")
        else:
            text_commands.append(f"({escaped_line}) Tj")
            text_commands.append("0 -14 Td")
    
    text_commands.append("ET")
    stream_content = "\n".join(text_commands)
    stream_len = len(stream_content.encode("latin-1"))
    
    objects = [
        "1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n",
        "2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n",
        "3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >>\nendobj\n",
        f"4 0 obj\n<< /Length {stream_len} >>\nstream\n{stream_content}\nendstream\nendobj\n",
        "5 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>\nendobj\n"
    ]
    
    pdf_output = "%PDF-1.4\n"
    offsets = []
    
    for obj in objects:
        offsets.append(len(pdf_output.encode("latin-1")))
        pdf_output += obj
        
    xref_offset = len(pdf_output.encode("latin-1"))
    pdf_output += "xref\n"
    pdf_output += f"0 {len(objects) + 1}\n"
    pdf_output += "0000000000 65535 f \n"
    for offset in offsets:
        pdf_output += f"{offset:010d} 00000 n \n"
        
    pdf_output += f"trailer\n<< /Size {len(objects) + 1} /Root 1 0 R >>\n"
    pdf_output += f"startxref\n{xref_offset}\n%%EOF\n"
    
    with open(filepath, "wb") as f:
        f.write(pdf_output.encode("latin-1"))

DOSSIERS = {
    "patient_1_sharma": {
        "name": "Rajesh Sharma",
        "docs": [
            (
                "01_Prescription_2022",
                "CITY HEALTH CLINIC - Outpatient Prescription",
                "Patient: Rajesh Sharma | Age: 58 | Date: 15/01/2022\n\n"
                "Diagnosis: Newly diagnosed Type 2 Diabetes Mellitus.\n\n"
                "Rx:\n"
                "1. Tab. Metformin 500 mg once daily with meals.\n"
                "2. Lifestyle and diet modification advised.\n\n"
                "Dr. A. Verma, MD Internal Medicine (Reg #44921)"
            ),
            (
                "02_Lab_Thyrocare_2023",
                "THYROCARE DIAGNOSTICS - Laboratory Report",
                "Patient: Rajesh Sharma | Ref By: Dr. Verma | Date: 04/05/2023\n\n"
                "TEST: Fasting Blood Glucose\n"
                "RESULT: 7.8 mmol/L  (Ref range: 3.9 - 5.6 mmol/L)\n"
                "STATUS: ELEVATED\n\n"
                "TEST: HbA1c\n"
                "RESULT: 7.4 %\n\n"
                "Verified by Dr. R. Sen, Consultant Biochemist"
            ),
            (
                "03_Prescription_2023",
                "APOLLO CLINIC - Follow-up Consultation",
                "Patient: Rajesh Sharma | Date: 12/05/2023\n\n"
                "Clinical Note: Suboptimal glycemic control on Metformin 500mg.\n\n"
                "Rx Adjustment:\n"
                "1. Tab. Metformin 850 mg twice daily with meals.\n"
                "2. Tab. Aspirin 75 mg once daily post-lunch.\n\n"
                "Dr. A. Verma, MD"
            ),
            (
                "04_Discharge_Surgery_Feb2024",
                "FORTIS HOSPITAL - Inpatient Discharge Summary",
                "Patient: Rajesh Sharma | IP No: 99420 | Date of Discharge: 10/02/2024\n\n"
                "Procedure: Laparoscopic Inguinal Hernia Repair\n\n"
                "Discharge Instructions:\n"
                "- Tab. Paracetamol 650mg SOS for pain.\n"
                "- Tab. Metformin 850mg resume tomorrow morning.\n"
                "- Tab. Aspirin 75mg TEMPORARILY HELD for surgery risk; do not resume until surgical review.\n\n"
                "Dr. K. Nambiar, MS FRCS"
            ),
            (
                "05_Consultation_Note_DrKapoor_Feb2024",
                "MEDANTA HEART INSTITUTE - Outpatient Cardiology Note",
                "Patient: Rajesh Sharma | Date: 18/02/2024\n\n"
                "Subjective: Patient presents for routine cardiovascular evaluation.\n"
                "Assessment: Stable coronary status, post-hernia repair.\n\n"
                "Plan:\n"
                "- Continue Tab. Aspirin 75mg daily for secondary cardioprotection.\n"
                "- Continue Metformin 850mg BD.\n\n"
                "Dr. S. Kapoor, DM Cardiology"
            )
        ]
    },
    "patient_2_patel": {
        "name": "Priya Patel",
        "docs": [
            (
                "01_Initial_Consult_2022",
                "METRO HEALTH - Comprehensive Intake Form",
                "Patient: Priya Patel | Age: 34 | Date: 10/03/2022\n\n"
                "Chief Complaint: General wellness checkup.\n"
                "Allergies: NKDA (No Known Drug Allergies) documented.\n"
                "Vitals: BP 118/76 mmHg, Pulse 72 bpm.\n\n"
                "Dr. Mehra, MBBS"
            ),
            (
                "02_Dermatology_2023",
                "SKIN & WELLNESS CARE - Consultation Note",
                "Patient: Priya Patel | Date: 20/07/2023\n\n"
                "Diagnosis: Contact dermatitis on bilateral hands.\n"
                "Rx: Hydrocortisone 1% topical cream twice daily for 7 days.\n\n"
                "Dr. S. Kulkarni, MD Dermatology"
            ),
            (
                "03_ER_Summary_2024",
                "MAX HOSPITAL - Emergency Department Summary",
                "Patient: Priya Patel | Date: 14/01/2024\n\n"
                "Emergency Presentation: Acute urticaria, lip angioedema, and wheezing following IV Ceftriaxone injection for UTI.\n"
                "Diagnosis: Severe Anaphylactic Reaction to Ceftriaxone.\n"
                "Treatment: IM Epinephrine 0.3mg, IV Hydrocortisone, nebulized salbutamol.\n"
                "CRITICAL WARNING: Ceftriaxone Allergy documented. Absolute contraindication.\n\n"
                "Dr. V. Gupta, Emergency Physician"
            ),
            (
                "04_Followup_Note_2024",
                "ALLERGY & ASTHMA CLINIC - Evaluation Note",
                "Patient: Priya Patel | Date: 28/01/2024\n\n"
                "Review of recent ER anaphylaxis episode.\n"
                "Confirmation: Confirmed severe Cephalosporin/Ceftriaxone allergy.\n"
                "Prescription: Auto-injector Epinephrine 0.3mg prescribed for emergency self-administration.\n\n"
                "Dr. R. Joshi, MD Immunology"
            ),
            (
                "05_Dental_Prescription_2024",
                "SMILE CARE DENTAL - Treatment Plan",
                "Patient: Priya Patel | Date: 05/04/2024\n\n"
                "Procedure: Molar extraction planned.\n"
                "Prophylaxis Rx: Tab. Amoxicillin 500mg tid for 5 days.\n"
                "Caution: Verify cross-reactivity with beta-lactam sensitivities.\n\n"
                "Dr. N. Shah, MDS"
            )
        ]
    },
    "patient_3_malhotra": {
        "name": "Vikram Malhotra",
        "docs": [
            (
                "01_Berlin_Clinic_Summary_2021",
                "CHARITE BERLIN - Arztbrief Ambulanz",
                "Patient: Vikram Malhotra | Geburtsdatum: 14.05.1972 | Datum: 12.08.2021\n\n"
                "Diagnose: Essentielle Hypertonie (Grad 1).\n"
                "Therapie: Ramipril 5 mg morgens 1x taglich.\n"
                "Blutdruck: 145/92 mmHg.\n\n"
                "Dr. med. H. Weber, Charite Berlin"
            ),
            (
                "02_NHS_UK_Blood_Panel_2022",
                "ST THOMAS HOSPITAL NHS - Biochemistry Report",
                "Patient: Vikram Malhotra | NHS No: 739 104 2291 | Date: 15/04/2022\n\n"
                "Serum Cholesterol: 6.2 mmol/L (Desirable: < 5.0 mmol/L)\n"
                "Serum Triglycerides: 2.1 mmol/L\n"
                "Serum Creatinine: 88 umol/L\n\n"
                "Authorized by NHS Pathology Labs"
            ),
            (
                "03_Cardiology_London_2023",
                "HARLEY STREET CLINIC - Outpatient Summary",
                "Patient: Vikram Malhotra | Date: 10/01/2023\n\n"
                "Review for hyperlipidemia and cardiovascular risk.\n"
                "Plan:\n"
                "1. Continue Ramipril 5mg daily.\n"
                "2. Start Tab. Atorvastatin 20mg once at bedtime.\n\n"
                "Dr. E. Clarke, FRCP"
            ),
            (
                "04_Telehealth_India_2023",
                "APOLLO 247 TELEHEALTH - Consultation Summary",
                "Patient: Vikram Malhotra | Date: 18/09/2023\n\n"
                "Chief Complaint: Home BP monitoring shows elevated systolic readings (150/95 mmHg).\n"
                "Rx Modification:\n"
                "- Up-titrate Ramipril to 10 mg once daily.\n"
                "- Continue Atorvastatin 20 mg.\n\n"
                "Dr. P. Sundaram, MD"
            ),
            (
                "05_Max_Healthcare_Delhi_2024",
                "MAX SUPERSPECIALTY HOSPITAL - Annual Health Review",
                "Patient: Vikram Malhotra | Date: 20/02/2024\n\n"
                "Assessment: Well-controlled hypertension on Ramipril 10mg. BP today 124/80 mmHg.\n"
                "12-Lead ECG: Normal sinus rhythm, no ischemic ST changes.\n\n"
                "Dr. V. Singhal, Senior Consultant"
            )
        ]
    },
    "patient_4_irfan": {
        "name": "Mohammed Irfan",
        "docs": [
            (
                "01_OPD_Fever_Jun10_2024",
                "CITY CLINIC - General OPD Note",
                "Patient: Mohammed Irfan | Age: 29 | Date: 10/06/2024 10:15 AM\n\n"
                "Symptoms: 3-day history of high-grade fever, chills, body ache.\n"
                "Investigations Ordered: Complete Blood Count (CBC), Dengue NS1 Ag.\n\n"
                "Dr. S. Tariq, MBBS"
            ),
            (
                "02_CBC_Lab_Report_Jun10_2024",
                "METROPOLIS HEALTHCARE - Diagnostic Lab Report",
                "Patient: Mohammed Irfan | Sample Collected: 10/06/2024 11:30 AM\n\n"
                "TEST: Complete Blood Count (CBC)\n"
                "Hemoglobin: 14.1 g/dL\n"
                "Total WBC Count: 11,200 /mcL (Ref: 4,000 - 10,000 /mcL)\n"
                "Platelet Count: 185,000 /mcL\n"
                "Dengue NS1 Antigen: NEGATIVE\n\n"
                "Dr. B. Roy, MD Pathologist"
            ),
            (
                "03_Second_Opinion_Jun12_2024",
                "SUBURBAN POLYCLINIC - Second Opinion OPD Note",
                "Patient: Mohammed Irfan | Date: 12/06/2024 09:30 AM\n\n"
                "Patient presents seeking second opinion for persisting fever.\n"
                "Provider repeats full diagnostic workup: CBC and peripheral smear ordered.\n\n"
                "Dr. A. Khan, MD"
            ),
            (
                "04_CBC_Lab_Report_Jun12_2024",
                "SRL DIAGNOSTICS - Hematology Report",
                "Patient: Mohammed Irfan | Sample Collected: 12/06/2024 10:45 AM\n\n"
                "TEST: Complete Blood Count (CBC) [REDUNDANT / REPEAT TEST]\n"
                "Hemoglobin: 14.0 g/dL\n"
                "Total WBC Count: 10,900 /mcL\n"
                "Platelet Count: 190,000 /mcL\n\n"
                "Verified by SRL Central Labs"
            ),
            (
                "05_Discharge_Summary_Jun15_2024",
                "MEDICARE NURSING HOME - Discharge Certificate",
                "Patient: Mohammed Irfan | Discharge Date: 15/06/2024\n\n"
                "Final Diagnosis: Viral fever with acute reactive leukocytosis, fully resolved.\n"
                "Afebrile for 48 hours. Vitals stable at discharge.\n\n"
                "Dr. S. Tariq, Physician"
            )
        ]
    },
    "patient_5_fernandes": {
        "name": "David Fernandes",
        "docs": [
            (
                "01_Orthopedic_Trauma_2021",
                "ST. JOHN'S HOSPITAL - Emergency Trauma Record",
                "Patient: David Fernandes | Age: 42 | Date: 14/09/2021\n\n"
                "Mechanism of Injury: Fall from bicycle onto outstretched right hand.\n"
                "Diagnosis: Closed Distal Radius Fracture (Colles fracture), right wrist.\n"
                "Management: Closed reduction and plaster cast immobilization performed.\n\n"
                "Dr. J. D'Souza, MS Ortho"
            ),
            (
                "02_XRay_Report_2021",
                "RADIOLOGY ASSOCIATES - Plain Radiograph Report",
                "Patient: David Fernandes | Date: 28/10/2021\n\n"
                "Examination: Right Wrist X-Ray (AP and Lateral views).\n"
                "Findings: Adequate callus formation across distal radial fracture line. Alignment anatomic.\n"
                "Impression: Satisfactory bony healing.\n\n"
                "Dr. M. Joseph, Radiologist"
            ),
            (
                "03_Physiotherapy_Log_2022",
                "ACTIVE REHABILITATION - Discharge Summary",
                "Patient: David Fernandes | Date: 15/01/2022\n\n"
                "Completed 12 sessions of right wrist mobilizations and strengthening.\n"
                "Outcome: Full active range of motion restored, pain-free grip strength.\n\n"
                "P. Nair, PT"
            ),
            (
                "04_Annual_Physical_2023",
                "CORPORATE HEALTH - Periodic Medical Assessment",
                "Patient: David Fernandes | Date: 10/11/2023\n\n"
                "General Physical Examination: Fit and healthy adult male.\n"
                "Blood Pressure: 116/74 mmHg | Resting Pulse: 64 bpm | BMI: 22.4 kg/m2\n"
                "Past History: Right wrist fracture (2021, fully healed). No chronic conditions.\n\n"
                "Dr. A. Rao, Occupational Health"
            ),
            (
                "05_Sports_Fitness_Clearance_2024",
                "SPORTS MEDICINE CLINIC - Athletic Clearance",
                "Patient: David Fernandes | Date: 05/03/2024\n\n"
                "Assessment for Marathon Participation.\n"
                "Cardiovascular & Musculoskeletal status: EXCELLENT.\n"
                "Clearance: Fully cleared for competitive endurance marathon running.\n\n"
                "Dr. T. Matthew, Sports Medicine Specialist"
            )
        ]
    }
}

def main():
    base_dir = Path(__file__).resolve().parent
    print(f"Generating synthetic dossiers under: {base_dir}")
    
    total_docs = 0
    for folder_name, patient_data in DOSSIERS.items():
        patient_dir = base_dir / folder_name
        patient_dir.mkdir(parents=True, exist_ok=True)
        
        for doc_base, title, content in patient_data["docs"]:
            txt_path = patient_dir / f"{doc_base}.txt"
            pdf_path = patient_dir / f"{doc_base}.pdf"
            
            with open(txt_path, "w", encoding="utf-8") as f:
                f.write(f"=== {title} ===\n\n{content}\n")
                
            create_simple_pdf(pdf_path, title, content)
            total_docs += 1
            
    print(f"Successfully generated 5 patient dossiers with {total_docs} valid PDF documents and text files.")

if __name__ == "__main__":
    main()
