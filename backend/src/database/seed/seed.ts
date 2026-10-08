import { AppDataSource } from '../data-source';
import * as bcrypt from 'bcryptjs';
import {
  User,
  ApplicantProfile,
  Education,
  Skill,
  Language,
  Employment,
  QualificationRequirement,
  Opportunity,
  EducaroService,
  RoutingRule,
  Journey,
  JourneyStep,
} from '../entities';
import {
  UserRole,
  GoalType,
  SourceType,
  VerificationStatus,
  OpportunityType,
  RecommendationType,
  JourneyStepStatus,
} from '../../common/enums';

export async function runSeed() {
  console.log('--- Starting Nexora Database Seed (DEMO DATA) ---');
  if (!AppDataSource.isInitialized) {
    await AppDataSource.initialize();
  }

  const userRepo = AppDataSource.getRepository(User);
  const profileRepo = AppDataSource.getRepository(ApplicantProfile);
  const eduRepo = AppDataSource.getRepository(Education);
  const empRepo = AppDataSource.getRepository(Employment);
  const skillRepo = AppDataSource.getRepository(Skill);
  const langRepo = AppDataSource.getRepository(Language);
  const reqRepo = AppDataSource.getRepository(QualificationRequirement);
  const oppRepo = AppDataSource.getRepository(Opportunity);
  const serviceRepo = AppDataSource.getRepository(EducaroService);
  const ruleRepo = AppDataSource.getRepository(RoutingRule);
  const journeyRepo = AppDataSource.getRepository(Journey);
  const stepRepo = AppDataSource.getRepository(JourneyStep);

  const hashedPassword = await bcrypt.hash('DemoPass123!', 10);

  // 1. Seed Demo Admin
  let admin = await userRepo.findOne({ where: { email: 'admin@nexora.de' } });
  if (!admin) {
    admin = userRepo.create({
      email: 'admin@nexora.de',
      passwordHash: hashedPassword,
      firstName: 'Nexora',
      lastName: 'Administrator',
      role: UserRole.ADMIN,
      phone: '+49 30 12345678',
      isActive: true,
    });
    await userRepo.save(admin);
    console.log('✓ Demo Admin created: admin@nexora.de / DemoPass123!');
  }

  // 2. Seed Demo Consultant
  let consultant = await userRepo.findOne({ where: { email: 'consultant@nexora.de' } });
  if (!consultant) {
    consultant = userRepo.create({
      email: 'consultant@nexora.de',
      passwordHash: hashedPassword,
      firstName: 'Elena',
      lastName: 'Schmidt',
      role: UserRole.CONSULTANT,
      phone: '+49 30 87654321',
      isActive: true,
    });
    await userRepo.save(consultant);
    console.log('✓ Demo Consultant created: consultant@nexora.de / DemoPass123!');
  }

  // 3. Seed Demo Applicant (Indian applicant exploring Germany)
  let applicant = await userRepo.findOne({ where: { email: 'applicant@nexora.de' } });
  if (!applicant) {
    applicant = userRepo.create({
      email: 'applicant@nexora.de',
      passwordHash: hashedPassword,
      firstName: 'Aarav',
      lastName: 'Sharma',
      role: UserRole.APPLICANT,
      phone: '+91 98765 43210',
      isActive: true,
    });
    await userRepo.save(applicant);

    // Profile
    const profile = profileRepo.create({
      userId: applicant.id,
      currentGoal: GoalType.AUSBILDUNG,
      phone: '+91 98765 43210',
      location: 'Bengaluru, India',
      availability: 'Within 3 months',
      bio: 'Enthusiastic computer science graduate seeking a Vocational Training (Ausbildung) in Software Engineering in Germany.',
      rawMotivation: 'I want to build a long-term engineering career in Germany through hands-on dual vocational training.',
      profileCompleteness: 75,
      readinessScore: 68,
      preferredPathways: [GoalType.AUSBILDUNG, GoalType.STUDY],
    });
    await profileRepo.save(profile);

    // Education
    const edu = eduRepo.create({
      profileId: profile.id,
      institution: 'Anna University, Chennai',
      degree: 'Bachelor of Engineering (B.E.)',
      fieldOfStudy: 'Computer Science and Engineering',
      graduationDate: '2024-06-15',
      gradeOrCgpa: '8.4 / 10.0 CGPA',
      division: 'First Class with Distinction',
      marksDetails: 'Verified 8 semesters transcript. Indian Bachelor degree H+ recognized.',
      sourceType: SourceType.DOCUMENT_EXTRACTED,
      confidence: 0.98,
      verificationStatus: VerificationStatus.VERIFIED,
    });
    await eduRepo.save(edu);

    // Skills
    const skillsData = [
      { name: 'TypeScript / JavaScript', category: 'Software Development', level: 'Advanced' },
      { name: 'React & Node.js', category: 'Web Development', level: 'Intermediate' },
      { name: 'Python', category: 'Programming', level: 'Intermediate' },
      { name: 'SQL & Databases', category: 'Backend', level: 'Intermediate' },
    ];
    for (const sk of skillsData) {
      await skillRepo.save(
        skillRepo.create({
          profileId: profile.id,
          name: sk.name,
          category: sk.category,
          proficiencyLevel: sk.level,
          sourceType: SourceType.APPLICANT_PROVIDED,
          confidence: 0.95,
          verificationStatus: VerificationStatus.PENDING,
        }),
      );
    }

    // Languages
    await langRepo.save(
      langRepo.create({
        profileId: profile.id,
        language: 'English',
        proficiencyLevel: 'C1',
        certificateType: 'IELTS Academic (7.5)',
        sourceType: SourceType.DOCUMENT_EXTRACTED,
        confidence: 0.99,
        verificationStatus: VerificationStatus.VERIFIED,
      }),
    );
    await langRepo.save(
      langRepo.create({
        profileId: profile.id,
        language: 'German',
        proficiencyLevel: 'A2',
        certificateType: 'Goethe-Zertifikat A2',
        sourceType: SourceType.DOCUMENT_EXTRACTED,
        confidence: 0.92,
        verificationStatus: VerificationStatus.VERIFIED,
      }),
    );

    // Journey
    const journey = journeyRepo.create({
      applicantId: applicant.id,
      currentState: 'QUALIFICATION',
      progressPercentage: 45,
    });
    await journeyRepo.save(journey);

    const steps = [
      { order: 1, code: 'PROFILE_SETUP', title: 'Complete Profile & Goals', description: 'Personal details, education and Germany goal selection.', status: JourneyStepStatus.COMPLETED },
      { order: 2, code: 'DOCUMENT_UPLOAD', title: 'Upload Degree & Certificates', description: 'Upload university degree, transcripts and language certificates.', status: JourneyStepStatus.COMPLETED },
      { order: 3, code: 'VIDEO_INTRO', title: 'Record Video Introduction', description: '60-second video explaining motivation for moving to Germany.', status: JourneyStepStatus.PENDING },
      { order: 4, code: 'QUALIFICATION_CHECK', title: 'Qualification Assessment', description: 'Deterministic eligibility evaluation against German requirements.', status: JourneyStepStatus.IN_PROGRESS },
      { order: 5, code: 'FIX_REQUIREMENTS', title: 'Bridge Missing Requirements', description: 'Satisfy missing criteria such as German B1 language certificate.', status: JourneyStepStatus.PENDING },
      { order: 6, code: 'OPPORTUNITY_MATCHING', title: 'Opportunity Matching', description: 'Explore matched Study, Ausbildung or Job positions in Germany.', status: JourneyStepStatus.LOCKED },
      { order: 7, code: 'EDUCARO_NEXT_STEP', title: 'Educaro Service & Guidance', description: 'Official Educaro onboarding and personalized pathway acceleration.', status: JourneyStepStatus.LOCKED },
      { order: 8, code: 'CV_GENERATION', title: 'Generate German Format CV', description: 'Create and export modern German standard CV & Cover Letter.', status: JourneyStepStatus.LOCKED },
    ];

    for (const s of steps) {
      await stepRepo.save(
        stepRepo.create({
          journeyId: journey.id,
          stepOrder: s.order,
          code: s.code,
          title: s.title,
          description: s.description,
          status: s.status,
        }),
      );
    }

    console.log('✓ Demo Applicant created: applicant@nexora.de / DemoPass123!');
  }

  // 4. Seed Qualification Requirements (DEMO DATA)
  const existingReqCount = await reqRepo.count();
  if (existingReqCount === 0) {
    const requirements = [
      // AUSBILDUNG
      { pathway: GoalType.AUSBILDUNG, category: 'LANGUAGE', title: 'German B1 Certificate', description: 'Minimum B1 level certified by Goethe, TELC, or TestDaF is mandatory for vocational schools in Germany.', ruleCode: 'GERMAN_B1', minimumLevel: 'B1', required: true, weight: 35 },
      { pathway: GoalType.AUSBILDUNG, category: 'EDUCATION', title: '12th Standard or Diploma', description: 'Higher Secondary School Certificate (12th Grade) recognized as equivalent to German Realschulabschluss or Abitur.', ruleCode: 'SCHOOL_12TH', minimumLevel: '50%', required: true, weight: 25 },
      { pathway: GoalType.AUSBILDUNG, category: 'DOCUMENTS', title: 'Valid Passport & Medical Fitness', description: 'Passport validity of at least 18 months and basic medical fitness declaration.', ruleCode: 'PASSPORT_VALID', minimumLevel: 'Valid', required: true, weight: 15 },
      { pathway: GoalType.AUSBILDUNG, category: 'MOTIVATION', title: 'Clear Pathway Motivation', description: 'Articulated career goal aligning with selected vocational craft.', ruleCode: 'MOTIVATION_STATEMENT', minimumLevel: 'Present', required: false, weight: 15 },
      { pathway: GoalType.AUSBILDUNG, category: 'MEDIA', title: 'Introduction Video', description: 'Short introduction video showcasing communication clarity.', ruleCode: 'INTRO_VIDEO', minimumLevel: 'Uploaded', required: false, weight: 10 },

      // STUDY
      { pathway: GoalType.STUDY, category: 'EDUCATION', title: 'Anabin Recognized Bachelor (H+)', description: 'Completed 3 or 4-year degree from a recognized institution with minimum 65% or 2.5 German GPA equivalent.', ruleCode: 'RECOGNIZED_BACHELOR', minimumLevel: '65%', required: true, weight: 35 },
      { pathway: GoalType.STUDY, category: 'DOCUMENTS', title: 'APS Certificate India', description: 'Mandatory verification certificate issued by the Academic Evaluation Centre (APS) New Delhi.', ruleCode: 'APS_CERTIFICATE', minimumLevel: 'Verified', required: true, weight: 30 },
      { pathway: GoalType.STUDY, category: 'LANGUAGE', title: 'English Proficiency (IELTS 6.5+)', description: 'For English-taught Master programs, minimum IELTS 6.5 or TOEFL 90.', ruleCode: 'ENGLISH_PROFICIENCY', minimumLevel: '6.5', required: true, weight: 20 },
      { pathway: GoalType.STUDY, category: 'LANGUAGE', title: 'German A1 for Everyday Life', description: 'Basic German proficiency recommended for university enrollment and visa interview.', ruleCode: 'GERMAN_A1', minimumLevel: 'A1', required: false, weight: 15 },

      // EMPLOYMENT
      { pathway: GoalType.EMPLOYMENT, category: 'EDUCATION', title: 'Recognized Higher Degree', description: 'University degree evaluated as comparable to a German degree (Anabin H+ or ZAB Statement of Comparability).', ruleCode: 'DEGREE_COMPARABILITY', minimumLevel: 'Comparable', required: true, weight: 30 },
      { pathway: GoalType.EMPLOYMENT, category: 'EXPERIENCE', title: 'Minimum 2 Years Relevant Experience', description: 'Documented full-time employment experience in the applied domain.', ruleCode: 'MIN_EXPERIENCE_2YRS', minimumLevel: '24 Months', required: true, weight: 30 },
      { pathway: GoalType.EMPLOYMENT, category: 'LANGUAGE', title: 'German Language Proficiency (A2+)', description: 'German A2 or B1 gives a decisive edge in team communication and visa approval.', ruleCode: 'GERMAN_A2', minimumLevel: 'A2', required: false, weight: 20 },
      { pathway: GoalType.EMPLOYMENT, category: 'SKILLS', title: 'Technical Skill Portfolio', description: 'Verified technical portfolio, GitHub, or technical certifications.', ruleCode: 'TECH_PORTFOLIO', minimumLevel: 'Verified', required: true, weight: 20 },
    ];

    for (const r of requirements) {
      await reqRepo.save(reqRepo.create({ ...r, isDemoData: true }));
    }
    console.log(`✓ Seeded ${requirements.length} Qualification Requirements (DEMO DATA)`);
  }

  // 5. Seed Educaro Services (DEMO DATA)
  const existingServiceCount = await serviceRepo.count();
  let langService: EducaroService;
  let apsService: EducaroService;
  let ausbildungService: EducaroService;
  let studyService: EducaroService;
  let employmentService: EducaroService;

  if (existingServiceCount === 0) {
    langService = await serviceRepo.save(
      serviceRepo.create({
        title: 'Educaro Fast-Track German Language Academy',
        category: 'LANGUAGE_PREPARATION',
        description: 'Intensive Goethe-aligned German language curriculum from A1 to B2 with certified native instructors, mock exams, and guaranteed test readiness.',
        entryCriteria: { targetPathways: ['AUSBILDUNG', 'STUDY', 'EMPLOYMENT'], minLanguageLevel: 'A0' },
        benefits: ['Live interactive sessions with native German teachers', 'Dedicated Goethe / TELC exam simulation', 'Fast-track progression in 12-16 weeks', 'Included in Educaro all-inclusive package'],
        duration: '14 Weeks',
        fee: 'Included in Educaro Program',
        isDemoData: true,
      }),
    );

    apsService = await serviceRepo.save(
      serviceRepo.create({
        title: 'Educaro APS & Credential Verification Suite',
        category: 'DOCUMENT_VERIFICATION',
        description: 'End-to-end documentation audit, notarization guidance, and expedited submission assistance for APS India certification and Anabin H+ equivalency verification.',
        entryCriteria: { targetPathways: ['STUDY', 'EMPLOYMENT'] },
        benefits: ['Pre-screening by certified Educaro document analysts', 'Zero rejection rate guarantee on document format', 'Direct liaison with German academic authorities'],
        duration: '4-6 Weeks',
        fee: 'Included in Educaro Program',
        isDemoData: true,
      }),
    );

    ausbildungService = await serviceRepo.save(
      serviceRepo.create({
        title: 'Educaro Ausbildung Placement & Visa Concierge',
        category: 'PATHWAY_COUNSELING',
        description: 'Comprehensive matching with accredited German enterprise employers for dual vocational training contracts, contract signing, and German consular visa interview coaching.',
        entryCriteria: { targetPathways: ['AUSBILDUNG'], minLanguageLevel: 'B1' },
        benefits: ['Guaranteed interviews with German partner firms', 'Monthly training stipend (€950 - €1,300/month)', 'Full German Embassy visa packet preparation', 'Relocation, health insurance, and German housing support'],
        duration: 'Ongoing until placement',
        fee: 'Partner-sponsored scholarship available',
        isDemoData: true,
      }),
    );

    studyService = await serviceRepo.save(
      serviceRepo.create({
        title: 'Educaro University Admissions & APS Support',
        category: 'APPLICATION_SUPPORT',
        description: 'Strategic university selection, Uni-Assist application filing, motivation letter review, and blocked account setup for top public German universities.',
        entryCriteria: { targetPathways: ['STUDY'], requiredReadinessScore: 70 },
        benefits: ['Direct partnerships with German Universities of Applied Sciences', 'Application fee waivers for partner institutions', 'Blocked account & health insurance guidance'],
        duration: '8-12 Weeks',
        fee: 'Included in Educaro Program',
        isDemoData: true,
      }),
    );

    employmentService = await serviceRepo.save(
      serviceRepo.create({
        title: 'Educaro Skilled Employment & Blue Card Track',
        category: 'APPLICATION_SUPPORT',
        description: 'Direct placement service for IT, engineering and healthcare professionals with German enterprises, offering Blue Card visa sponsorship and relocation support.',
        entryCriteria: { targetPathways: ['EMPLOYMENT'], minLanguageLevel: 'A2' },
        benefits: ['Curated direct interview pipeline with German tech employers', 'Full EU Blue Card legal compliance check', 'Family reunion visa guidance'],
        duration: '12-16 Weeks',
        fee: 'Employer-sponsored',
        isDemoData: true,
      }),
    );

    console.log('✓ Seeded 5 Educaro Services (DEMO DATA)');
  } else {
    langService = await serviceRepo.findOne({ where: { category: 'LANGUAGE_PREPARATION' } });
    apsService = await serviceRepo.findOne({ where: { category: 'DOCUMENT_VERIFICATION' } });
    ausbildungService = await serviceRepo.findOne({ where: { category: 'PATHWAY_COUNSELING' } });
  }

  // 6. Seed Routing Rules (DEMO DATA)
  const existingRuleCount = await ruleRepo.count();
  if (existingRuleCount === 0 && langService) {
    const rules = [
      {
        name: 'Missing German Language Requirement -> Route to Educaro Language Academy',
        conditionType: 'MISSING_LANGUAGE',
        conditionExpression: { missingRequirementCode: 'GERMAN_B1' },
        targetType: RecommendationType.EDUCARO_SERVICE,
        targetServiceId: langService.id,
        priority: 100,
        reasonTemplate: 'Your current German level does not meet the B1 requirement for German vocational schools. Enrolling in the Educaro Fast-Track German Language Academy is the highest-impact action to unlock your eligibility.',
      },
      {
        name: 'Missing APS Certificate -> Route to Educaro APS Verification Suite',
        conditionType: 'MISSING_DOCUMENTS',
        conditionExpression: { missingRequirementCode: 'APS_CERTIFICATE' },
        targetType: RecommendationType.EDUCARO_SERVICE,
        targetServiceId: apsService?.id,
        priority: 90,
        reasonTemplate: 'The APS certificate is a mandatory prerequisite for Indian applicants seeking study in Germany. The Educaro APS Verification Suite will streamline your document submission and verification.',
      },
      {
        name: 'Inconsistency Detected or Ambiguous Profile -> Consultant Referral',
        conditionType: 'UNRESOLVED_INCONSISTENCY',
        conditionExpression: { hasInconsistency: true },
        targetType: RecommendationType.CONSULTANT_REFERRAL,
        targetServiceId: null,
        priority: 95,
        reasonTemplate: 'Potential discrepancies were noted between your uploaded records. An Educaro advisor will review your dossier personally to clarify and ensure full consular compliance.',
      },
      {
        name: 'High Readiness Ausbildung Applicant -> Direct Placement Concierge',
        conditionType: 'QUALIFIED_READY',
        conditionExpression: { pathway: 'AUSBILDUNG', minReadinessScore: 80 },
        targetType: RecommendationType.EDUCARO_SERVICE,
        targetServiceId: ausbildungService?.id,
        priority: 80,
        reasonTemplate: 'Congratulations! Your profile meets high eligibility criteria for vocational training. We recommend connecting immediately with the Educaro Ausbildung Placement Concierge to begin employer interviews.',
      },
    ];

    for (const r of rules) {
      await ruleRepo.save(ruleRepo.create({ ...r, isDemoData: true }));
    }
    console.log(`✓ Seeded ${rules.length} Routing Rules (DEMO DATA)`);
  }

  // 7. Seed Database-backed Opportunities (DEMO DATA)
  const existingOppCount = await oppRepo.count();
  if (existingOppCount === 0) {
    const opportunities = [
      // AUSBILDUNG
      {
        title: 'Fachinformatiker für Anwendungsentwicklung (Software Developer)',
        type: OpportunityType.AUSBILDUNG,
        organization: 'Siemens AG',
        location: 'Frankfurt am Main, Germany',
        description: 'Three-year dual vocational training program combining practical software engineering in cloud and IoT systems with state vocational school education. Monthly stipend: €1,150 - €1,300.',
        requirements: { minGermanLevel: 'B1', educationField: ['Computer Science', 'Science', 'Mathematics'], skillsRequired: ['Object-Oriented Programming', 'Problem Solving'] },
        tags: ['IT', 'Software', 'Dual Training', 'Funded Stipend'],
        deadline: '2026-11-30',
        externalUrl: 'https://jobs.siemens.com/ausbildung',
      },
      {
        title: 'Pflegefachkraft (General Healthcare Nursing Specialist)',
        type: OpportunityType.AUSBILDUNG,
        organization: 'Klinikum Stuttgart',
        location: 'Stuttgart, Germany',
        description: 'Accredited vocational nurse training program across clinical diagnostics and patient care with guaranteed permanent employment upon completion. Monthly stipend: €1,200 - €1,400.',
        requirements: { minGermanLevel: 'B2', educationField: ['Any 12th Pass', 'Biology'], skillsRequired: ['Empathy', 'Communication'] },
        tags: ['Healthcare', 'Nursing', 'Permanent Job Guarantee'],
        deadline: '2026-12-15',
        externalUrl: 'https://www.klinikum-stuttgart.de/karriere',
      },
      {
        title: 'Mechatroniker / Industriemechaniker Ausbildung',
        type: OpportunityType.AUSBILDUNG,
        organization: 'BMW Group',
        location: 'Munich, Germany',
        description: 'Hands-on training in automotive robotics, automation systems, and precision mechanical assembly at BMW manufacturing centers.',
        requirements: { minGermanLevel: 'B1', educationField: ['Mechanical', 'Physics', '12th Pass'], skillsRequired: ['Technical Aptitude', 'Teamwork'] },
        tags: ['Automotive', 'Mechatronics', 'High Technology'],
        deadline: '2026-10-31',
        externalUrl: 'https://www.bmwgroup.jobs/ausbildung',
      },

      // STUDY
      {
        title: 'M.Sc. Informatics / Computer Science',
        type: OpportunityType.STUDY,
        organization: 'Technical University of Munich (TUM)',
        location: 'Munich, Germany',
        description: 'Top-ranked Master degree program covering AI, distributed algorithms, cybersecurity and software engineering taught entirely in English.',
        requirements: { minEnglishLevel: 'IELTS 7.0', minGermanLevel: 'A1', educationField: ['Computer Science', 'Information Technology'], minExperienceMonths: 0 },
        tags: ['Public University', 'English Taught', 'Top 50 Worldwide'],
        deadline: '2026-11-15',
        externalUrl: 'https://www.tum.de/en/studies/degree-programs/informatics-master-of-science-msc',
      },
      {
        title: 'M.Sc. Sustainable Energy Systems Engineering',
        type: OpportunityType.STUDY,
        organization: 'RWTH Aachen University',
        location: 'Aachen, Germany',
        description: 'Prestigious engineering program focusing on photovoltaic grids, hydrogen infrastructure and green mobility technologies.',
        requirements: { minEnglishLevel: 'IELTS 6.5', educationField: ['Electrical', 'Mechanical', 'Energy Engineering'] },
        tags: ['TU9', 'Public University', 'Excellence Cluster'],
        deadline: '2026-12-01',
        externalUrl: 'https://www.rwth-aachen.de',
      },

      // EMPLOYMENT
      {
        title: 'Cloud Full-Stack Software Engineer (TypeScript & Node.js)',
        type: OpportunityType.EMPLOYMENT,
        organization: 'Zalando SE',
        location: 'Berlin, Germany',
        description: 'Engineering role on modern microservices architectures and customer applications. Full visa sponsorship under EU Blue Card regulations.',
        requirements: { minGermanLevel: 'A2', minEnglishLevel: 'Fluent', minExperienceMonths: 24, skillsRequired: ['TypeScript', 'React', 'Node.js', 'PostgreSQL', 'Docker'] },
        tags: ['Tech', 'EU Blue Card', 'Visa Sponsored', 'English Workplace'],
        deadline: '2026-11-20',
        externalUrl: 'https://jobs.zalando.com',
      },
      {
        title: 'Embedded Firmware Developer',
        type: OpportunityType.EMPLOYMENT,
        organization: 'Robert Bosch GmbH',
        location: 'Stuttgart, Germany',
        description: 'Design and verification of safety-critical automotive firmware and microcontroller sensor stacks.',
        requirements: { minGermanLevel: 'B1', minExperienceMonths: 36, skillsRequired: ['C/C++', 'RTOS', 'CAN Bus', 'Embedded Linux'] },
        tags: ['Automotive', 'Embedded', 'Industry 4.0'],
        deadline: '2026-12-31',
        externalUrl: 'https://www.bosch.com/careers',
      },
    ];

    for (const opp of opportunities) {
      await oppRepo.save(oppRepo.create({ ...opp, isDemoData: true }));
    }
    console.log(`✓ Seeded ${opportunities.length} Database Opportunities (DEMO DATA)`);
  }

  console.log('--- Nexora Database Seed Completed Successfully ---');
}

if (require.main === module) {
  runSeed()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error('Seed error:', err);
      process.exit(1);
    });
}
