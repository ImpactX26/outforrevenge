import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

export async function runSeed() {
  console.log('--- Starting Nexora Prisma Database Seed (DEMO DATA) ---');

  const hashedPassword = await bcrypt.hash('DemoPass123!', 10);

  // 1. Seed Demo Admin (DEMO DATA)
  const admin = await prisma.user.upsert({
    where: { email: 'admin@nexora.de' },
    update: {},
    create: {
      email: 'admin@nexora.de',
      passwordHash: hashedPassword,
      firstName: 'Nexora',
      lastName: 'Administrator',
      role: 'ADMIN',
      phone: '+49 30 12345678',
      isActive: true,
    },
  });
  console.log('✓ Demo Admin ensured: admin@nexora.de (DEMO DATA)');

  // 2. Seed Demo Consultant (DEMO DATA)
  const consultant = await prisma.user.upsert({
    where: { email: 'consultant@nexora.de' },
    update: {},
    create: {
      email: 'consultant@nexora.de',
      passwordHash: hashedPassword,
      firstName: 'Elena',
      lastName: 'Schmidt',
      role: 'CONSULTANT',
      phone: '+49 30 87654321',
      isActive: true,
    },
  });
  console.log('✓ Demo Consultant ensured: consultant@nexora.de (DEMO DATA)');

  // 3. Seed Demo Applicant (DEMO ENVIRONMENT ONLY - NEVER RUN IN PRODUCTION WITHOUT EXPLICIT FLAG)
  const isProduction = process.env.NODE_ENV === 'production';
  const enableDemoApplicants = process.env.ENABLE_DEMO_SEED === 'true' || !isProduction;

  if (enableDemoApplicants) {
    let applicant = await prisma.user.findUnique({
      where: { email: 'applicant@nexora.de' },
      include: { profile: true },
    });

    if (!applicant) {
    applicant = await prisma.user.create({
      data: {
        email: 'applicant@nexora.de',
        passwordHash: hashedPassword,
        firstName: 'Aarav',
        lastName: 'Sharma',
        role: 'APPLICANT',
        phone: '+91 98765 43210',
        isActive: true,
        profile: {
          create: {
            currentGoal: 'AUSBILDUNG',
            phone: '+91 98765 43210',
            location: 'Bengaluru, India',
            availability: 'Within 3 months',
            bio: 'Enthusiastic computer science graduate seeking a Vocational Training (Ausbildung) in Software Engineering in Germany.',
            rawMotivation: 'I want to build a long-term engineering career in Germany through hands-on dual vocational training.',
            profileCompleteness: 75,
            readinessScore: 68,
            preferredPathways: ['AUSBILDUNG', 'STUDY'],
            educations: {
              create: [
                {
                  institution: 'Anna University, Chennai',
                  degree: 'Bachelor of Engineering (B.E.)',
                  fieldOfStudy: 'Computer Science and Engineering',
                  graduationDate: '2024-06-15',
                  gradeOrCgpa: '8.4 / 10.0 CGPA',
                  division: 'First Class with Distinction',
                  marksDetails: 'Verified 8 semesters transcript. Indian Bachelor degree H+ recognized.',
                  sourceType: 'DOCUMENT_EXTRACTED',
                  confidence: 0.98,
                  verificationStatus: 'VERIFIED',
                },
              ],
            },
            skills: {
              create: [
                { name: 'TypeScript / JavaScript', category: 'Software Development', proficiencyLevel: 'Advanced', sourceType: 'APPLICANT_PROVIDED', confidence: 0.95, verificationStatus: 'PENDING' },
                { name: 'React & Node.js', category: 'Web Development', proficiencyLevel: 'Intermediate', sourceType: 'APPLICANT_PROVIDED', confidence: 0.95, verificationStatus: 'PENDING' },
                { name: 'Python', category: 'Programming', proficiencyLevel: 'Intermediate', sourceType: 'APPLICANT_PROVIDED', confidence: 0.95, verificationStatus: 'PENDING' },
                { name: 'SQL & Databases', category: 'Backend', proficiencyLevel: 'Intermediate', sourceType: 'APPLICANT_PROVIDED', confidence: 0.95, verificationStatus: 'PENDING' },
              ],
            },
            languages: {
              create: [
                { language: 'English', proficiencyLevel: 'C1', certificateType: 'IELTS Academic (7.5)', sourceType: 'DOCUMENT_EXTRACTED', confidence: 0.99, verificationStatus: 'VERIFIED' },
                { language: 'German', proficiencyLevel: 'A2', certificateType: 'Goethe-Zertifikat A2', sourceType: 'DOCUMENT_EXTRACTED', confidence: 0.92, verificationStatus: 'VERIFIED' },
              ],
            },
          },
        },
        journey: {
          create: {
            currentState: 'QUALIFICATION',
            progressPercentage: 45,
            steps: {
              create: [
                { stepOrder: 1, code: 'PROFILE_SETUP', title: 'Complete Profile & Goals', description: 'Personal details, education and Germany goal selection.', status: 'COMPLETED' },
                { stepOrder: 2, code: 'DOCUMENT_UPLOAD', title: 'Upload Degree & Certificates', description: 'Upload university degree, transcripts and language certificates.', status: 'COMPLETED' },
                { stepOrder: 3, code: 'VIDEO_INTRO', title: 'Record Video Introduction', description: '60-second video explaining motivation for moving to Germany.', status: 'PENDING' },
                { stepOrder: 4, code: 'QUALIFICATION_CHECK', title: 'Qualification Assessment', description: 'Deterministic eligibility evaluation against German requirements.', status: 'IN_PROGRESS' },
                { stepOrder: 5, code: 'FIX_REQUIREMENTS', title: 'Bridge Missing Requirements', description: 'Satisfy missing criteria such as German B1 language certificate.', status: 'PENDING' },
                { stepOrder: 6, code: 'OPPORTUNITY_MATCHING', title: 'Opportunity Matching', description: 'Explore matched Study, Ausbildung or Job positions in Germany.', status: 'LOCKED' },
                { stepOrder: 7, code: 'EDUCARO_NEXT_STEP', title: 'Educaro Service & Guidance', description: 'Official Educaro onboarding and personalized pathway acceleration.', status: 'LOCKED' },
                { stepOrder: 8, code: 'CV_GENERATION', title: 'Generate German Format CV', description: 'Create and export modern German standard CV & Cover Letter.', status: 'LOCKED' },
              ],
            },
          },
        },
      },
      include: { profile: true },
    });
    console.log('✓ Demo Applicant created: applicant@nexora.de (DEMO DATA)');
  } else {
    console.log('ℹ Production environment: skipped demo applicant creation.');
  }

  // 4. Seed Qualification Requirements (DEMO DATA)
  const existingReqs = await prisma.qualificationRequirement.count();
  if (existingReqs === 0) {
    const requirements = [
      // AUSBILDUNG
      { pathway: 'AUSBILDUNG', category: 'LANGUAGE', title: 'German B1 Certificate', description: 'Minimum B1 level certified by Goethe, TELC, or TestDaF is mandatory for vocational schools in Germany.', ruleCode: 'GERMAN_B1', minimumLevel: 'B1', required: true, weight: 35, isDemoData: true },
      { pathway: 'AUSBILDUNG', category: 'EDUCATION', title: '12th Standard or Diploma', description: 'Higher Secondary School Certificate (12th Grade) recognized as equivalent to German Realschulabschluss or Abitur.', ruleCode: 'SCHOOL_12TH', minimumLevel: '50%', required: true, weight: 25, isDemoData: true },
      { pathway: 'AUSBILDUNG', category: 'DOCUMENTS', title: 'Valid Passport & Medical Fitness', description: 'Passport validity of at least 18 months and basic medical fitness declaration.', ruleCode: 'PASSPORT_VALID', minimumLevel: 'Valid', required: true, weight: 15, isDemoData: true },
      { pathway: 'AUSBILDUNG', category: 'MOTIVATION', title: 'Clear Pathway Motivation', description: 'Articulated career goal aligning with selected vocational craft.', ruleCode: 'MOTIVATION_STATEMENT', minimumLevel: 'Present', required: false, weight: 15, isDemoData: true },
      { pathway: 'AUSBILDUNG', category: 'MEDIA', title: 'Introduction Video', description: 'Short introduction video showcasing communication clarity.', ruleCode: 'INTRO_VIDEO', minimumLevel: 'Uploaded', required: false, weight: 10, isDemoData: true },

      // STUDY
      { pathway: 'STUDY', category: 'EDUCATION', title: 'Anabin Recognized Bachelor (H+)', description: 'Completed 3 or 4-year degree from a recognized institution with minimum 65% or 2.5 German GPA equivalent.', ruleCode: 'RECOGNIZED_BACHELOR', minimumLevel: '65%', required: true, weight: 35, isDemoData: true },
      { pathway: 'STUDY', category: 'DOCUMENTS', title: 'APS Certificate India', description: 'Mandatory verification certificate issued by the Academic Evaluation Centre (APS) New Delhi.', ruleCode: 'APS_CERTIFICATE', minimumLevel: 'Verified', required: true, weight: 30, isDemoData: true },
      { pathway: 'STUDY', category: 'LANGUAGE', title: 'English Proficiency (IELTS 6.5+)', description: 'For English-taught Master programs, minimum IELTS 6.5 or TOEFL 90.', ruleCode: 'ENGLISH_PROFICIENCY', minimumLevel: '6.5', required: true, weight: 20, isDemoData: true },
      { pathway: 'STUDY', category: 'LANGUAGE', title: 'German A1 for Everyday Life', description: 'Basic German proficiency recommended for university enrollment and visa interview.', ruleCode: 'GERMAN_A1', minimumLevel: 'A1', required: false, weight: 15, isDemoData: true },

      // EMPLOYMENT
      { pathway: 'EMPLOYMENT', category: 'EDUCATION', title: 'Recognized Higher Degree', description: 'University degree evaluated as comparable to a German degree (Anabin H+ or ZAB Statement of Comparability).', ruleCode: 'DEGREE_COMPARABILITY', minimumLevel: 'Comparable', required: true, weight: 30, isDemoData: true },
      { pathway: 'EMPLOYMENT', category: 'EXPERIENCE', title: 'Minimum 2 Years Relevant Experience', description: 'Documented full-time employment experience in the applied domain.', ruleCode: 'MIN_EXPERIENCE_2YRS', minimumLevel: '24 Months', required: true, weight: 30, isDemoData: true },
      { pathway: 'EMPLOYMENT', category: 'LANGUAGE', title: 'German Language Proficiency (A2+)', description: 'German A2 or B1 gives a decisive edge in team communication and visa approval.', ruleCode: 'GERMAN_A2', minimumLevel: 'A2', required: false, weight: 20, isDemoData: true },
      { pathway: 'EMPLOYMENT', category: 'SKILLS', title: 'Technical Skill Portfolio', description: 'Verified technical portfolio, GitHub, or technical certifications.', ruleCode: 'TECH_PORTFOLIO', minimumLevel: 'Verified', required: true, weight: 20, isDemoData: true },
    ];

    for (const r of requirements) {
      await prisma.qualificationRequirement.create({ data: r as any });
    }
    console.log(`✓ Seeded ${requirements.length} Qualification Requirements (DEMO DATA)`);
  }

  // 5. Seed Educaro Services (DEMO DATA)
  const existingServices = await prisma.educaroService.count();
  let langService: any;
  let apsService: any;
  let ausbildungService: any;

  if (existingServices === 0) {
    langService = await prisma.educaroService.create({
      data: {
        title: 'Educaro Fast-Track German Language Academy',
        category: 'LANGUAGE_PREPARATION',
        description: 'Intensive Goethe-aligned German language curriculum from A1 to B2 with certified native instructors, mock exams, and guaranteed test readiness.',
        entryCriteria: { targetPathways: ['AUSBILDUNG', 'STUDY', 'EMPLOYMENT'], minLanguageLevel: 'A0' },
        benefits: ['Live interactive sessions with native German teachers', 'Dedicated Goethe / TELC exam simulation', 'Fast-track progression in 12-16 weeks', 'Included in Educaro all-inclusive package'],
        duration: '14 Weeks',
        fee: 'Included in Educaro Program',
        isDemoData: true,
      },
    });

    apsService = await prisma.educaroService.create({
      data: {
        title: 'Educaro APS & Credential Verification Suite',
        category: 'DOCUMENT_VERIFICATION',
        description: 'End-to-end documentation audit, notarization guidance, and expedited submission assistance for APS India certification and Anabin H+ equivalency verification.',
        entryCriteria: { targetPathways: ['STUDY', 'EMPLOYMENT'] },
        benefits: ['Pre-screening by certified Educaro document analysts', 'Zero rejection rate guarantee on document format', 'Direct liaison with German academic authorities'],
        duration: '4-6 Weeks',
        fee: 'Included in Educaro Program',
        isDemoData: true,
      },
    });

    ausbildungService = await prisma.educaroService.create({
      data: {
        title: 'Educaro Ausbildung Placement & Visa Concierge',
        category: 'PATHWAY_COUNSELING',
        description: 'Comprehensive matching with accredited German enterprise employers for dual vocational training contracts, contract signing, and German consular visa interview coaching.',
        entryCriteria: { targetPathways: ['AUSBILDUNG'], minLanguageLevel: 'B1' },
        benefits: ['Guaranteed interviews with German partner firms', 'Monthly training stipend (€950 - €1,300/month)', 'Full German Embassy visa packet preparation', 'Relocation, health insurance, and German housing support'],
        duration: 'Ongoing until placement',
        fee: 'Partner-sponsored scholarship available',
        isDemoData: true,
      },
    });

    await prisma.educaroService.create({
      data: {
        title: 'Educaro University Admissions & APS Support',
        category: 'APPLICATION_SUPPORT',
        description: 'Strategic university selection, Uni-Assist application filing, motivation letter review, and blocked account setup for top public German universities.',
        entryCriteria: { targetPathways: ['STUDY'], requiredReadinessScore: 70 },
        benefits: ['Direct partnerships with German Universities of Applied Sciences', 'Application fee waivers for partner institutions', 'Blocked account & health insurance guidance'],
        duration: '8-12 Weeks',
        fee: 'Included in Educaro Program',
        isDemoData: true,
      },
    });

    await prisma.educaroService.create({
      data: {
        title: 'Educaro Skilled Employment & Blue Card Track',
        category: 'APPLICATION_SUPPORT',
        description: 'Direct placement service for IT, engineering and healthcare professionals with German enterprises, offering Blue Card visa sponsorship and relocation support.',
        entryCriteria: { targetPathways: ['EMPLOYMENT'], minLanguageLevel: 'A2' },
        benefits: ['Curated direct interview pipeline with German tech employers', 'Full EU Blue Card legal compliance check', 'Family reunion visa guidance'],
        duration: '12-16 Weeks',
        fee: 'Employer-sponsored',
        isDemoData: true,
      },
    });

    console.log('✓ Seeded 5 Educaro Services (DEMO DATA)');
  } else {
    langService = await prisma.educaroService.findFirst({ where: { category: 'LANGUAGE_PREPARATION' } });
    apsService = await prisma.educaroService.findFirst({ where: { category: 'DOCUMENT_VERIFICATION' } });
    ausbildungService = await prisma.educaroService.findFirst({ where: { category: 'PATHWAY_COUNSELING' } });
  }

  // 6. Seed Routing Rules (DEMO DATA)
  const existingRules = await prisma.routingRule.count();
  if (existingRules === 0 && langService) {
    const rules = [
      {
        name: 'Missing German Language Requirement -> Route to Educaro Language Academy',
        conditionType: 'MISSING_LANGUAGE',
        conditionExpression: { missingRequirementCode: 'GERMAN_B1' },
        targetType: 'EDUCARO_SERVICE',
        targetServiceId: langService.id,
        priority: 100,
        reasonTemplate: 'Your current German level does not meet the B1 requirement for German vocational schools. Enrolling in the Educaro Fast-Track German Language Academy is the highest-impact action to unlock your eligibility.',
        isDemoData: true,
      },
      {
        name: 'Missing APS Certificate -> Route to Educaro APS Verification Suite',
        conditionType: 'MISSING_DOCUMENTS',
        conditionExpression: { missingRequirementCode: 'APS_CERTIFICATE' },
        targetType: 'EDUCARO_SERVICE',
        targetServiceId: apsService?.id,
        priority: 90,
        reasonTemplate: 'The APS certificate is a mandatory prerequisite for Indian applicants seeking study in Germany. The Educaro APS Verification Suite will streamline your document submission and verification.',
        isDemoData: true,
      },
      {
        name: 'Inconsistency Detected or Ambiguous Profile -> Consultant Referral',
        conditionType: 'UNRESOLVED_INCONSISTENCY',
        conditionExpression: { hasInconsistency: true },
        targetType: 'CONSULTANT_REFERRAL',
        targetServiceId: null,
        priority: 95,
        reasonTemplate: 'Potential discrepancies were noted between your uploaded records. An Educaro advisor will review your dossier personally to clarify and ensure full consular compliance.',
        isDemoData: true,
      },
      {
        name: 'High Readiness Ausbildung Applicant -> Direct Placement Concierge',
        conditionType: 'QUALIFIED_READY',
        conditionExpression: { pathway: 'AUSBILDUNG', minReadinessScore: 80 },
        targetType: 'EDUCARO_SERVICE',
        targetServiceId: ausbildungService?.id,
        priority: 80,
        reasonTemplate: 'Congratulations! Your profile meets high eligibility criteria for vocational training. We recommend connecting immediately with the Educaro Ausbildung Placement Concierge to begin employer interviews.',
        isDemoData: true,
      },
    ];

    for (const r of rules) {
      await prisma.routingRule.create({ data: r as any });
    }
    console.log(`✓ Seeded ${rules.length} Routing Rules (DEMO DATA)`);
  }

  // 7. Seed Database Opportunities (DEMO DATA)
  const existingOpps = await prisma.opportunity.count();
  if (existingOpps === 0) {
    const opportunities = [
      {
        title: 'Fachinformatiker für Anwendungsentwicklung (Software Developer)',
        type: 'AUSBILDUNG',
        organization: 'Siemens AG',
        location: 'Frankfurt am Main, Germany',
        description: 'Three-year dual vocational training program combining practical software engineering in cloud and IoT systems with state vocational school education. Monthly stipend: €1,150 - €1,300.',
        requirements: { minGermanLevel: 'B1', educationField: ['Computer Science', 'Science', 'Mathematics'], skillsRequired: ['Object-Oriented Programming', 'Problem Solving'] },
        tags: ['IT', 'Software', 'Dual Training', 'Funded Stipend'],
        deadline: '2026-11-30',
        externalUrl: 'https://jobs.siemens.com/ausbildung',
        isDemoData: true,
      },
      {
        title: 'Pflegefachkraft (General Healthcare Nursing Specialist)',
        type: 'AUSBILDUNG',
        organization: 'Klinikum Stuttgart',
        location: 'Stuttgart, Germany',
        description: 'Accredited vocational nurse training program across clinical diagnostics and patient care with guaranteed permanent employment upon completion. Monthly stipend: €1,200 - €1,400.',
        requirements: { minGermanLevel: 'B2', educationField: ['Any 12th Pass', 'Biology'], skillsRequired: ['Empathy', 'Communication'] },
        tags: ['Healthcare', 'Nursing', 'Permanent Job Guarantee'],
        deadline: '2026-12-15',
        externalUrl: 'https://www.klinikum-stuttgart.de/karriere',
        isDemoData: true,
      },
      {
        title: 'Mechatroniker / Industriemechaniker Ausbildung',
        type: 'AUSBILDUNG',
        organization: 'BMW Group',
        location: 'Munich, Germany',
        description: 'Hands-on training in automotive robotics, automation systems, and precision mechanical assembly at BMW manufacturing centers.',
        requirements: { minGermanLevel: 'B1', educationField: ['Mechanical', 'Physics', '12th Pass'], skillsRequired: ['Technical Aptitude', 'Teamwork'] },
        tags: ['Automotive', 'Mechatronics', 'High Technology'],
        deadline: '2026-10-31',
        externalUrl: 'https://www.bmwgroup.jobs/ausbildung',
        isDemoData: true,
      },
      {
        title: 'M.Sc. Informatics / Computer Science',
        type: 'STUDY',
        organization: 'Technical University of Munich (TUM)',
        location: 'Munich, Germany',
        description: 'Top-ranked Master degree program covering AI, distributed algorithms, cybersecurity and software engineering taught entirely in English.',
        requirements: { minEnglishLevel: 'IELTS 7.0', minGermanLevel: 'A1', educationField: ['Computer Science', 'Information Technology'], minExperienceMonths: 0 },
        tags: ['Public University', 'English Taught', 'Top 50 Worldwide'],
        deadline: '2026-11-15',
        externalUrl: 'https://www.tum.de/en/studies/degree-programs/informatics-master-of-science-msc',
        isDemoData: true,
      },
      {
        title: 'M.Sc. Sustainable Energy Systems Engineering',
        type: 'STUDY',
        organization: 'RWTH Aachen University',
        location: 'Aachen, Germany',
        description: 'Prestigious engineering program focusing on photovoltaic grids, hydrogen infrastructure and green mobility technologies.',
        requirements: { minEnglishLevel: 'IELTS 6.5', educationField: ['Electrical', 'Mechanical', 'Energy Engineering'] },
        tags: ['TU9', 'Public University', 'Excellence Cluster'],
        deadline: '2026-12-01',
        externalUrl: 'https://www.rwth-aachen.de',
        isDemoData: true,
      },
      {
        title: 'Cloud Full-Stack Software Engineer (TypeScript & Node.js)',
        type: 'EMPLOYMENT',
        organization: 'Zalando SE',
        location: 'Berlin, Germany',
        description: 'Engineering role on modern microservices architectures and customer applications. Full visa sponsorship under EU Blue Card regulations.',
        requirements: { minGermanLevel: 'A2', minEnglishLevel: 'Fluent', minExperienceMonths: 24, skillsRequired: ['TypeScript', 'React', 'Node.js', 'PostgreSQL', 'Docker'] },
        tags: ['Tech', 'EU Blue Card', 'Visa Sponsored', 'English Workplace'],
        deadline: '2026-11-20',
        externalUrl: 'https://jobs.zalando.com',
        isDemoData: true,
      },
      {
        title: 'Embedded Firmware Developer',
        type: 'EMPLOYMENT',
        organization: 'Robert Bosch GmbH',
        location: 'Stuttgart, Germany',
        description: 'Design and verification of safety-critical automotive firmware and microcontroller sensor stacks.',
        requirements: { minGermanLevel: 'B1', minExperienceMonths: 36, skillsRequired: ['C/C++', 'RTOS', 'CAN Bus', 'Embedded Linux'] },
        tags: ['Automotive', 'Embedded', 'Industry 4.0'],
        deadline: '2026-12-31',
        externalUrl: 'https://www.bosch.com/careers',
        isDemoData: true,
      },
    ];

    for (const opp of opportunities) {
      await prisma.opportunity.create({ data: opp as any });
    }
    console.log(`✓ Seeded ${opportunities.length} Database Opportunities (DEMO DATA)`);
  }

  console.log('--- Nexora Prisma Database Seed Completed Successfully ---');
}

runSeed()
  .catch((e) => {
    console.error('Seed execution error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
