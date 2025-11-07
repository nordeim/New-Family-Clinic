# Project_Requirements_Document.md

## Executive Summary & Project Vision

### Project Genesis
The Gabriel Family Clinic Healthcare Platform v2.0 represents a strategic evolution from a single-clinic solution into a **multi-tenant, ecosystem-integrated healthcare platform** designed specifically for Singapore's aging population and regulatory landscape. This rebuild addresses critical scalability limitations while introducing next-generation capabilities including AI-assisted clinical workflows, telemedicine, and pharmacy ecosystem integration.

### Core Philosophy
- **Elderly-First Design**: Every feature is validated against senior usability (age 65+)
- **Compliance by Construction**: Regulatory requirements (PDPA, MOH, CHAS) are design constraints, not afterthoughts
- **Zero-Trust Healthcare**: Row-level security, encrypted data-at-rest, comprehensive audit trails
- **Ecosystem Thinking**: Seamless integration with pharmacies, laboratories, and national health records

### Strategic Objectives
1. **Clinic Network Expansion**: Support 5+ clinic locations within 12 months
2. **Revenue Diversification**: +15% per-patient revenue via telemedicine and value-added services
3. **Operational Excellence**: 30% reduction in administrative overhead through automation
4. **Technology Leadership**: Position as Singapore's premier elderly-friendly digital health platform
5. **Regulatory Excellence**: Proactive compliance automation and real-time audit capabilities

---

## Functional Requirements

### 1. Patient Portal Requirements

#### 1.1 Registration & Onboarding
| Requirement ID | Description | Acceptance Criteria | Compliance Tag |
|----------------|-------------|---------------------|----------------|
| PT-REG-001 | Multi-step registration with Singapore NRIC validation | System validates NRIC checksum, masks display as S****567D, encrypts at-rest | PDPA-DATA-001 |
| PT-REG-002 | CHAS card integration with real-time subsidy calculation | Scans CHAS QR code, validates with CHAS API, calculates subsidies (Blue: $18.50, Orange: $11.00, Green: $7.50) | CHAS-001 |
| PT-REG-003 | Emergency contact management | Stores 2+ contacts, validates Singapore phone format (+65), enables SMS notifications | PDPA-CONSENT-001 |
| PT-REG-004 | Medical history capture (chronic conditions, allergies) | Auto-complete from Singapore Disease Database, supports ICD-10 codes | HEALTH-RECORD-001 |
| PT-REG-005 | OTP verification for mobile number | 6-digit OTP via SMS, 3-attempt limit, 5-minute expiry | AUTH-002 |

#### 1.2 Appointment Management
| Requirement ID | Description | Acceptance Criteria | Compliance Tag |
|----------------|-------------|---------------------|----------------|
| PT-APT-001 | Real-time doctor availability with CHAS subsidy preview | Shows real-time slots, displays patient-payable amount after CHAS, <2s load time | PERF-001 |
| PT-APT-002 | Multi-channel booking (web, WhatsApp) | WhatsApp "Book Appointment" button auto-fills patient details, syncs with web system | INTEGRATION-001 |
| PT-APT-003 | Appointment modification/cancellation | Allows changes up to 24h before, updates CHAS subsidy recalculation, triggers refund if needed | CHAS-002 |
| PT-APT-004 | Automated reminders (Email, WhatsApp, SMS) | 24h and 2h before appointment, includes doctor details, location, preparation instructions | ENGAGEMENT-001 |
| PT-APT-005 | Telemedicine session initiation | One-click join, WebRTC-based, end-to-end encrypted, records session duration for billing | TELEMED-001 |

#### 1.3 Medical Records Access
| Requirement ID | Description | Acceptance Criteria | Compliance Tag |
|----------------|-------------|---------------------|----------------|
| PT-MR-001 | Timeline view of medical history | Chronological view, filters by date range, specialty, condition, search by keyword | HEALTH-RECORD-002 |
| PT-MR-002 | Secure document upload (X-rays, reports) | Max 50MB per file, virus scan, encrypts at-rest, generates access audit log | SECURITY-003 |
| PT-MR-003 | Share records with external providers | Generates time-limited secure link (48h), requires OTP verification, logs access | PDPA-SHARE-001 |
| PT-MR-004 | Download personal health record (PDPA right) | Generates PDF summary, includes all records, delivery within 24h request | PDPA-RIGHT-001 |
| PT-MR-005 | AI-powered health insights (opt-in) | Analyzes trends (BP, glucose), provides personalized recommendations, human-reviewed | AI-001 |

#### 1.4 Prescription Management
| Requirement ID | Description | Acceptance Criteria | Compliance Tag |
|----------------|-------------|---------------------|----------------|
| PT-PRE-001 | View active prescriptions with refill alerts | Shows medication image, dosage, next refill date, alerts 7 days before expiry | HEALTH-002 |
| PT-PRE-002 | E-prescription to pharmacy integration | One-click send to Guardian/Watsons/Unity, QR code for in-store verification, tracks status | INTEGRATION-002 |
| PT-PRE-003 | Medication adherence tracking | Patient checks off daily doses, generates adherence report for doctor, gamification for seniors | ENGAGEMENT-002 |
| PT-PRE-004 | Drug interaction warnings | Checks against patient's current medications, highlights interactions, suggests alternatives | AI-002 |

#### 1.5 Payment & Billing
| Requirement ID | Description | Acceptance Criteria | Compliance Tag |
|----------------|-------------|---------------------|----------------|
| PT-PAY-001 | Multi-payment methods (PayNow, Credit Card, CHAS) | QR code for PayNow, Stripe integration, auto-applies CHAS subsidy, generates receipt | PAYMENT-001 |
| PT-PAY-002 | CHAS subsidy breakdown display | Shows original price, subsidy amount, final payable, CHAS card used | CHAS-003 |
| PT-PAY-003 | Payment history and receipts | Downloadable PDF receipts, filter by date, export for insurance claims | HEALTH-003 |
| PT-PAY-004 | Outstanding balance notifications | Automated reminders for unpaid balances, payment plan options for large bills | ENGAGEMENT-003 |

#### 1.6 Health Engagement
| Requirement ID | Description | Acceptance Criteria | Compliance Tag |
|----------------|-------------|---------------------|----------------|
| PT-ENG-001 | Personalized health articles via AI | Recommends based on chronic conditions, age, language preference, tracks reading time | AI-003 |
| PT-ENG-002 | WhatsApp health tips (weekly) | Sends personalized tips, includes unsubscribe link, tracks engagement metrics | WHATSAPP-001 |
| PT-ENG-003 | Health goal setting and progress tracking | Weight, BP, activity goals, visual progress charts, doctor review integration | ENGAGEMENT-004 |
| PT-ENG-004 | Community forum (moderated) | Q&A with doctors, peer support, human moderation, flag inappropriate content | COMMUNITY-001 |

---

### 2. Doctor Portal Requirements

#### 2.1 Patient Management
| Requirement ID | Description | Acceptance Criteria | Compliance Tag |
|----------------|-------------|---------------------|----------------|
| DR-PT-001 | Patient list with advanced filtering | Filter by name, NRIC (masked), condition, last visit date, CHAS status | HEALTH-RECORD-003 |
| DR-PT-002 | One-click access to patient medical records | Loads complete history <1s, shows warning for overdue tests, highlights critical values | PERF-002 |
| DR-PT-003 | Patient risk stratification dashboard | AI-powered risk scoring (diabetes, heart disease), prioritizes high-risk patients | AI-004 |
| DR-PT-004 | Telemedicine waiting room | Shows queued patients, session start, alerts for technical issues | TELEMED-002 |

#### 2.2 Appointment Management
| Requirement ID | Description | Acceptance Criteria | Compliance Tag |
|----------------|-------------|---------------------|----------------|
| DR-APT-001 | Calendar view with customizable time slots | Drag-and-drop scheduling, block personal time, sync with Google/Outlook | HEALTH-004 |
| DR-APT-002 | Appointment notes and templates | Pre-filled templates for common conditions, voice-to-text dictation, saves to medical record | HEALTH-005 |
| DR-APT-003 | No-show tracking and follow-up | Marks no-shows, triggers automated reminder sequence, escalates to admin after 3 no-shows | ENGAGEMENT-005 |
| DR-APT-004 | Multi-location scheduling | Shows availability across clinic locations, optimizes travel time, syncs with telemedicine | MULTI-TENANCY-001 |

#### 2.3 Medical Records & Prescriptions
| Requirement ID | Description | Acceptance Criteria | Compliance Tag |
|----------------|-------------|---------------------|----------------|
| DR-MR-001 | Structured medical note creation | ICD-10 code autocomplete, medication integration, auto-saves every 30s | HEALTH-005 |
| DR-MR-002 | E-prescription with drug interaction checking | Real-time interaction warnings, suggests alternatives, integrates with pharmacy API | AI-002 |
| DR-MR-003 | Lab order management | Selects tests, sends to integrated labs, tracks status, receives results electronically | INTEGRATION-003 |
| DR-MR-004 | Medical image upload and annotation | DICOM support, annotation tools, shares with specialists | HEALTH-006 |

#### 2.4 Clinical Decision Support
| Requirement ID | Description | Acceptance Criteria | Compliance Tag |
|----------------|-------------|---------------------|----------------|
| DR-AI-001 | AI-powered diagnosis suggestions | Analyzes symptoms, suggests differential diagnoses, requires doctor confirmation | AI-005 |
| DR-AI-002 | Evidence-based treatment protocols | Shows NICE guidelines, Singapore MOH protocols, updates quarterly | HEALTH-007 |
| DR-AI-003 | Predictive analytics for chronic disease progression | Forecasts BP, glucose trends, suggests interventions | AI-006 |

---

### 3. Administrative Portal Requirements

#### 3.1 System Management
| Requirement ID | Description | Acceptance Criteria | Compliance Tag |
|----------------|-------------|---------------------|----------------|
| ADM-SYS-001 | Multi-clinic tenant management | Create, configure, brand individual clinics, set billing tiers, manage users | MULTI-TENANCY-002 |
| ADM-SYS-002 | Feature flag management | Enable/disable features per clinic, percentage rollouts, targeted user groups | DEV-001 |
| ADM-SYS-003 | Performance monitoring and alerting | Real-time dashboard, alerts for slow queries, error rate spikes, CHAS calculation issues | OBSERVABILITY-001 |
| ADM-SYS-004 | System configuration and settings | Manage appointment types, consultation fees, CHAS rates, notification preferences | CONFIG-001 |

#### 3.2 User Administration
| Requirement ID | Description | Acceptance Criteria | Compliance Tag |
|----------------|-------------|---------------------|----------------|
| ADM-USER-001 | Role-based access control (RBAC) management | Define custom roles, permissions matrix, audit permission changes | SECURITY-001 |
| ADM-USER-002 | User onboarding and offboarding | Bulk import, automated welcome emails, revoke access triggers data archive | SECURITY-002 |
| ADM-USER-003 | Session management and security | View active sessions, force logout, device fingerprinting | SECURITY-004 |

#### 3.3 Financial & Reporting
| Requirement ID | Description | Acceptance Criteria | Compliance Tag |
|----------------|-------------|---------------------|----------------|
| ADM-FIN-001 | CHAS claims management | Generate monthly CHAS submission files, tracks reimbursement status | CHAS-004 |
| ADM-FIN-002 | Clinic performance analytics | Patient volume, revenue, no-show rates, doctor utilization | ANALYTICS-001 |
| ADM-FIN-003 | Financial reconciliation | Reconciles payments with bank statements, flags discrepancies | HEALTH-008 |

#### 3.4 Security & Compliance
| Requirement ID | Description | Acceptance Criteria | Compliance Tag |
|----------------|-------------|---------------------|----------------|
| ADM-SEC-001 | Real-time security monitoring | Detects brute force attacks, suspicious access patterns, alerts admin | SECURITY-005 |
| ADM-SEC-002 | Audit log review and export | Filter by user, action, date, export for regulatory inspection | AUDIT-001 |
| ADM-SEC-003 | PDPA compliance dashboard | Shows consent status, data retention status, breach risk indicators | COMPLIANCE-001 |

---

### 4. Telemedicine Requirements

#### 4.1 Session Management
| Requirement ID | Description | Acceptance Criteria | Compliance Tag |
|----------------|-------------|---------------------|----------------|
| TM-Session-001 | Secure WebRTC session initiation | Token-based authentication, 30-minute expiry, one-time use | TELEMED-003 |
| TM-Session-002 | Video/audio quality management | Adaptive bitrate, fallback to audio-only, network degradation alerts | TELEMED-004 |
| TM-Session-003 | Session recording and storage | Patient consent required, encrypted storage (AWS S3), auto-delete after 7 years | PDPA-RECORD-001 |
| TM-Session-004 | Session summary generation | AI generates visit note, doctor reviews and edits, saves to medical record | AI-007 |

#### 4.2 Clinical Workflow
| Requirement ID | Description | Acceptance Criteria | Compliance Tag |
|----------------|-------------|---------------------|----------------|
| TM-WF-001 | Pre-session questionnaire | Patient completes symptoms, vitals before session, auto-populates note | HEALTH-009 |
| TM-WF-002 | In-session prescription writing | Doctor writes e-prescription during call, pharmacy receives instantly | INTEGRATION-004 |
| TM-WF-003 | Post-session follow-up | Automated care instructions via WhatsApp, follow-up appointment scheduling | ENGAGEMENT-006 |

---

### 5. Integration Requirements

#### 5.1 Pharmacy Integration
| Requirement ID | Description | Acceptance Criteria | Compliance Tag |
|----------------|-------------|---------------------|----------------|
| INT-PHARM-001 | E-prescription transmission to major pharmacies | Supports Guardian, Watsons, Unity, NTUC, QR code generation | INTEGRATION-005 |
| INT-PHARM-002 | Prescription status tracking | Real-time status (received, preparing, ready, collected) | INTEGRATION-006 |
| INT-PHARM-003 | Medication inventory check | Checks stock before sending, suggests alternatives if unavailable | INTEGRATION-007 |

#### 5.2 Laboratory Integration
| Requirement ID | Description | Acceptance Criteria | Compliance Tag |
|----------------|-------------|---------------------|----------------|
| INT-LAB-001 | Electronic lab order transmission | Sends to Wah Proctor, Raffles, includes LOINC codes | INTEGRATION-008 |
| INT-LAB-002 | Results webhook ingestion | Receives structured results, parses critical values, auto-updates patient record | INTEGRATION-009 |
| INT-LAB-003 | Critical value alert system | <5 minute notification to doctor, escalation if no acknowledgment | HEALTH-010 |

#### 5.3 Wearable Device Integration
| Requirement ID | Description | Acceptance Criteria | Compliance Tag |
|----------------|-------------|---------------------|----------------|
| INT-WEAR-001 | OAuth2 connection for Fitbit, Apple Health | Patient authorizes via OAuth, syncs data daily | INTEGRATION-010 |
| INT-WEAR-002 | Health metrics data ingestion | BP, glucose, heart rate, steps, sleep, stores with timestamp | HEALTH-011 |
| INT-WEAR-003 | Trend analysis and alerting | Detects anomalies (BP spike, low glucose), alerts patient and doctor | AI-008 |

#### 5.4 Communication Integration
| Requirement ID | Description | Acceptance Criteria | Compliance Tag |
|----------------|-------------|---------------------|----------------|
| INT-WHATSAPP-001 | WhatsApp Business API integration | Sends appointment reminders, prescription ready, health tips | WHATSAPP-002 |
| INT-WHATSAPP-002 | Two-way messaging support | Patients can reply, messages routed to clinic staff, 24h response SLA | WHATSAPP-003 |
| INT-WHATSAPP-003 | Message template management | Pre-approved templates, personalized variables, tracks delivery status | WHATSAPP-004 |

---

### 6. Multi-Tenancy & Scalability Requirements

#### 6.1 Clinic Tenant Management
| Requirement ID | Description | Acceptance Criteria | Compliance Tag |
|----------------|-------------|---------------------|----------------|
| MT-TENANT-001 | Onboard new clinic location | <30 minute setup, subdomain assignment, branding configuration | MULTI-TENANCY-003 |
| MT-TENANT-002 | Tenant data isolation | Row-level security prevents cross-clinic data access, penetration test passed | SECURITY-006 |
| MT-TENANT-003 | Feature gating by clinic tier | Standard vs Premium tiers, feature flags per clinic | CONFIG-002 |
| MT-TENANT-004 | Centralized admin oversight | Superadmin can view all clinics, but access logged for audit | AUDIT-002 |

#### 6.2 Performance & Scalability
| Requirement ID | Description | Acceptance Criteria | Compliance Tag |
|----------------|-------------|---------------------|----------------|
| MT-SCALE-001 | Support 10,000+ patients per clinic | Database indexes optimized, query performance <500ms p95 | PERF-003 |
| MT-SCALE-002 | Handle 100+ concurrent bookings | Connection pooling, rate limiting, optimistic locking | PERF-004 |
| MT-SCALE-003 | Geographic distribution support | Multi-region deployment (Singapore, Tokyo), automated failover | INFRA-001 |

---

### 7. Security & Compliance Requirements

#### 7.1 Data Protection
| Requirement ID | Description | Acceptance Criteria | Compliance Tag |
|----------------|-------------|---------------------|----------------|
| SEC-DATA-001 | NRIC encryption at-rest | AES-256 encryption, key rotation every 90 days, HSM-backed keys | PDPA-DATA-002 |
| SEC-DATA-002 | Medical record access logging | Every read logged with user, timestamp, IP, purpose, retained 7 years | AUDIT-003 |
| SEC-DATA-003 | Data retention automation | Auto-delete per PDPA schedule, archive to cold storage, anonymize after retention | COMPLIANCE-002 |

#### 7.2 Access Control
| Requirement ID | Description | Acceptance Criteria | Compliance Tag |
|----------------|-------------|---------------------|----------------|
| SEC-ACCESS-001 | Role-based access control | Patients, Doctors, Admin, Staff, Superadmin with granular permissions | SECURITY-007 |
| SEC-ACCESS-002 | Two-factor authentication | TOTP-based, mandatory for doctors/admins, optional for patients | SECURITY-008 |
| SEC-ACCESS-003 | Session management | Device fingerprinting, concurrent session limit, auto-logout after inactivity | SECURITY-009 |

#### 7.3 Audit & Compliance
| Requirement ID | Description | Acceptance Criteria | Compliance Tag |
|----------------|-------------|---------------------|----------------|
| AUDIT-001 | Comprehensive audit trail | All CRUD operations on PHI logged, immutable logs, tamper detection | AUDIT-004 |
| AUDIT-002 | Compliance verification automation | Daily automated PDPA checks, monthly compliance reports | COMPLIANCE-003 |
| AUDIT-003 | Incident response logging | Security incidents logged with timeline, response actions, post-mortem | SECURITY-010 |

---

### 8. Testing & Quality Requirements

| Requirement ID | Description | Acceptance Criteria | Compliance Tag |
|----------------|-------------|---------------------|----------------|
| TEST-001 | Unit test coverage | >90% coverage for business logic, run in CI/CD | QUALITY-001 |
| TEST-002 | E2E test coverage | Critical user journeys: registration, booking, payment, telemedicine | QUALITY-002 |
| TEST-003 | Accessibility testing | WCAG AAA compliance, axe-core automated, manual testing with screen readers | ACCESSIBILITY-001 |
| TEST-004 | Security testing | OWASP Top 10, penetration testing quarterly, dependency scanning | SECURITY-011 |
| TEST-005 | Performance testing | Load testing 1000 concurrent users, p95 latency targets met | PERF-005 |

---

### 9. Deployment & Operations Requirements

| Requirement ID | Description | Acceptance Criteria | Compliance Tag |
|----------------|-------------|---------------------|----------------|
| DEPLOY-001 | Zero-downtime deployments | Database migrations with RLS, blue-green deployment, rollback <5 min | DEV-002 |
| DEPLOY-002 | Multi-region deployment | Primary Singapore, replica Tokyo, automated failover <5 min | INFRA-002 |
| DEPLOY-003 | Monitoring and alerting | Real-time dashboards, PagerDuty integration, SLA: 99.9% uptime | OBSERVABILITY-002 |
| DEPLOY-004 | Backup and recovery | Daily backups, 30-day retention, <1 hour restore time, DR tested quarterly | INFRA-003 |

---

## Non-Functional Requirements

### Performance
- **Response Time**: p95 API latency <500ms, p99 <1000ms
- **Throughput**: Support 100+ concurrent bookings per clinic
- **Scalability**: Linear scaling to 10 clinics, 100,000 patients
- **Resource Usage**: Bundle size <300KB, Lighthouse score >95

### Security
- **Authentication**: JWT tokens, 2FA for staff, session timeout 30min
- **Authorization**: Row-level security, role-based access, principle of least privilege
- **Data Protection**: AES-256 encryption, key rotation, secure key management
- **Audit**: 100% PHI access logged, logs immutable for 7 years

### Accessibility
- **WCAG AAA Compliance**: 7:1 contrast ratio, 18px+ base font, 44px+ touch targets
- **Screen Reader Support**: ARIA labels, semantic HTML, keyboard navigation
- **Reduced Motion**: Respects `prefers-reduced-motion`, gentle animations
- **Cognitive Accessibility**: Simple language, clear error messages, guided workflows

### Compliance
- **PDPA**: Consent management, data retention, breach notification within 72h
- **MOH Guidelines**: Follows Singapore Ministry of Health digital health standards
- **CHAS Integration**: Real-time subsidy calculation, submission file generation
- **Data Residency**: All patient data stored in Singapore AWS region

### Reliability
- **Availability**: 99.9% uptime (8.76 hours downtime/year)
- **Fault Tolerance**: Database replication, automated failover, circuit breakers
- **Recovery**: RTO <5 minutes, RPO <1 minute

---

## Data Requirements

### Master Data
- **Clinics**: 5 initial tenants with unique subdomains
- **Users**: 10,000 patients, 50 doctors, 20 admin staff
- **Medical**: ICD-10 codes, Singapore drug database, CHAS rates
- **Content**: 100+ health articles, 20 medication adherence guides

### Transaction Data
- **Appointments**: 500/day per clinic, 250,000/year total
- **Medical Records**: 1,000/day, 500,000/year
- **Payments**: $2M/year processing, CHAS subsidy tracking
- **Audit Logs**: 10M/year entries, retained 7 years

### Reference Data
- **Singapore Postcodes**: 1.8M entries for address validation
- **MCR Database**: Singapore Medical Council registry integration
- **HSA Drug Database**: 20,000+ medications with codes

---

## Assumptions & Constraints

### Assumptions
1. **Internet Connectivity**: Patients have 4G+ internet for telemedicine
2. **Device Ownership**: 90% of seniors have smartphones (WhatsApp)
3. **CHAS API**: Stable API from Agency for Integrated Care (AIC)
4. **Pharmacy APIs**: Partners provide sandbox and production environments
5. **Regulatory Stability**: PDPA and MOH guidelines remain consistent

### Constraints
1. **Budget**: $150K development, $30K/month operational
2. **Timeline**: 9 months to full production
3. **Team**: 3 senior developers, 1 healthcare domain expert
4. **Compliance**: All features must pass healthcare security review
5. **Elderly Usability**: No feature can compromise senior accessibility

---

## Success Criteria

### Launch Readiness (Month 6)
- ✅ All core features functional in staging
- ✅ Security penetration test passed
- ✅ Performance targets met (p95 <500ms)
- ✅ Accessibility audit (WCAG AAA)
- ✅ CHAS integration certified by AIC

### Production Readiness (Month 9)
- ✅ 99.9% uptime for 30 days
- ✅ 1000+ patients registered
- ✅ 500+ appointments booked
- ✅ Zero data breaches
- ✅ <5% patient-reported issues

### Business Impact (Month 12)
- ✅ 5 clinic locations onboarded
- ✅ 15% increase in per-patient revenue
- ✅ 30% reduction in admin overhead
- ✅ 20% improvement in patient retention
- ✅ 95% patient satisfaction score

---

**Document Version**: 2.0.0  
**Last Updated**: November 7, 2025  
**Approved by**: [To be signed off by Project Sponsor]
