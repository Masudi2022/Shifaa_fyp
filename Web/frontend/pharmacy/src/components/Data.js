import image1 from './Images/choose.jpeg';

const Data = [
  {
    chronic_diseases: [
      {
        name: "Diabetes",
        types: ["Type 1 Diabetes", "Type 2 Diabetes"],
        medicines: [
          {
            name: "Metformin",
            description: "Helps control blood sugar levels.",
            image: image1
          },
          {
            name: "Insulin",
            description: "Used for managing blood sugar in Type 1 and sometimes Type 2 diabetes.",
            image: image1
          },
          {
            name: "Glipizide",
            description: "Stimulates the pancreas to release insulin.",
            image: image1
          },
          {
            name: "SGLT2 Inhibitors",
            description: "Helps the kidneys remove sugar from the body through urine.",
            examples: ["Canagliflozin"],
            image: image1
          }
        ]
      },
      {
        name: "Hypertension",
        types: ["High Blood Pressure"],
        medicines: [
          {
            name: "Amlodipine",
            description: "A calcium channel blocker that helps relax blood vessels.",
            image: image1
          },
          {
            name: "Lisinopril",
            description: "An ACE inhibitor that relaxes blood vessels.",
            image: image1
          },
          {
            name: "Losartan",
            description: "An angiotensin II receptor blocker (ARB) that helps blood vessels relax.",
            image: image1
          },
          {
            name: "Hydrochlorothiazide",
            description: "A diuretic that helps reduce blood pressure by removing excess salt and water from the body.",
            image: image1
          }
        ]
      },
      {
        name: "Asthma",
        types: ["Allergic Asthma", "Non-Allergic Asthma"],
        medicines: [
          {
            name: "Albuterol",
            description: "A bronchodilator that helps open airways.",
            image: image1
          },
          {
            name: "Fluticasone",
            description: "An inhaled corticosteroid that reduces inflammation in the airways.",
            image: image1
          },
          {
            name: "Montelukast",
            description: "A leukotriene receptor antagonist that helps prevent asthma symptoms.",
            image: image1
          },
          {
            name: "Theophylline",
            description: "A bronchodilator that helps relax the muscles of the airways.",
            image: image1
          }
        ]
      },
      {
        name: "Chronic Kidney Disease",
        types: ["Stage 1", "Stage 2", "Stage 3", "Stage 4", "Stage 5"],
        medicines: [
          {
            name: "Lisinopril",
            description: "An ACE inhibitor that helps protect kidneys from damage.",
            image: image1
          },
          {
            name: "Losartan",
            description: "An ARB that helps reduce protein in the urine and protect kidney function.",
            image: image1
          },
          {
            name: "Erythropoietin",
            description: "A hormone that helps stimulate red blood cell production in cases of anemia.",
            image: image1
          },
          {
            name: "Phosphate Binders",
            description: "Helps reduce phosphate levels in the blood.",
            image: image1
          }
        ]
      },
      {
        name: "Chronic Obstructive Pulmonary Disease (COPD)",
        types: ["Chronic Bronchitis", "Emphysema"],
        medicines: [
          {
            name: "Tiotropium",
            description: "A long-acting bronchodilator that helps open airways.",
            image: image1
          },
          {
            name: "Budesonide",
            description: "An inhaled corticosteroid used to reduce inflammation in the airways.",
            image: image1
          },
          {
            name: "Formoterol",
            description: "A long-acting beta agonist that helps to open airways and make breathing easier.",
            image: image1
          },
          {
            name: "Prednisone",
            description: "An oral corticosteroid used for severe exacerbations of COPD.",
            image: image1
          }
        ]
      },
      {
        name: "Heart Disease",
        types: ["Coronary Artery Disease", "Heart Failure", "Arrhythmias"],
        medicines: [
          {
            name: "Aspirin",
            description: "Helps reduce the risk of heart attacks and strokes.",
            image: image1
          },
          {
            name: "Beta Blockers",
            description: "Helps manage heart rate and blood pressure.",
            image: image1
          },
          {
            name: "Statins",
            description: "Helps lower cholesterol levels and reduce the risk of heart disease.",
            image: image1
          },
          {
            name: "ACE Inhibitors",
            description: "Helps relax blood vessels and reduce strain on the heart.",
            image: image1
          }
        ]
      }
    ]
  }
];

export default Data;
