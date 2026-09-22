import os
import datetime
import random
from sqlalchemy.orm import Session
from app.database import SessionLocal, engine, Base
from app.auth.jwt import get_password_hash
import app.models
from app.models.auth import User, Role, Permission
from app.models.organization import Organization, Subsidiary, Region, Mine, MineZone
from app.models.workforce import Worker, WorkerDocument, Attendance
from app.models.machinery import Machine, MachineMaintenance, MachineDocument, ProductionRecord
from app.models.contractors import Contractor, ContractorWorker, ContractorDocument, ContractorRiskScore
from app.models.inspections import InspectionTemplate, InspectionItem, Inspection, InspectionFinding
from app.models.safety import SafetyObservation, Incident, IncidentInvestigation, NearMiss
from app.models.violations import Violation
from app.models.corrective_actions import CorrectiveAction, CorrectiveActionEvidence, CorrectiveActionVerification
from app.models.compliance import ComplianceItem, ComplianceRecord
from app.models.environment import EnvironmentalReading
from app.models.documents import Document, DocumentOCRData
from app.models.regulatory import RegulatoryAction, RegulatoryApplication
from app.models.alerts import Alert, Notification, Escalation
from app.models.ai import AIRiskScore, AIAnomaly, AIRecurringPattern, AIRecommendation, AIPrediction
from app.models.initiatives import SafetyInitiative, TrainingProgram, TrainingParticipation
from app.models.reports import GeneratedReport
from app.models.audit import AuditLog, AuditChainMetadata
from app.services.audit_service import record_audit_event, GENESIS_HASH

def seed_database():
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    
    print("[Seed] Initializing Genesis Audit Block...")
    meta = AuditChainMetadata(
        genesis_hash=GENESIS_HASH,
        last_block_hash=GENESIS_HASH,
        total_events_count=0,
        verification_status="HASH_CHAIN_VALID"
    )
    db.add(meta)
    db.commit()
    
    # 1. Organizations & Subsidiaries
    print("[Seed] Seeding Organizations, Subsidiaries, and Regions...")
    org1 = Organization(code="ORG-BCE", name="Bharat Coal Enterprises Ltd", headquarters="New Delhi, India", compliance_score=94.2)
    org2 = Organization(code="ORG-DMC", name="Deccan Mining Corporation", headquarters="Hyderabad, India", compliance_score=88.5)
    org3 = Organization(code="ORG-EML", name="Eastern Minerals Limited", headquarters="Kolkata, India", compliance_score=91.0)
    db.add_all([org1, org2, org3])
    db.commit()
    
    sub1 = Subsidiary(organization_id=org1.id, code="SUB-NCL", name="Northern Coalfields Division")
    sub2 = Subsidiary(organization_id=org1.id, code="SUB-ECL", name="Eastern Coalfields Division")
    sub3 = Subsidiary(organization_id=org2.id, code="SUB-SCC", name="Southern Coalfields Division")
    db.add_all([sub1, sub2, sub3])
    db.commit()
    
    reg1 = Region(code="REG-EAST", name="Singrauli-Sonbhadra Belt", state="Madhya Pradesh", jurisdiction_code="DGMS-EAST-01")
    reg2 = Region(code="REG-CENT", name="Korba-Raigarh Basin", state="Chhattisgarh", jurisdiction_code="DGMS-CENT-02")
    reg3 = Region(code="REG-JHAR", name="Dhanbad-Jharia Basin", state="Jharkhand", jurisdiction_code="DGMS-JHAR-03")
    db.add_all([reg1, reg2, reg3])
    db.commit()
    
    # 2. Mines & Zones (6 Realistic Indian Coal Mines)
    print("[Seed] Seeding 6 Mines and 24 Operating Zones...")
    mines_data = [
        {"code": "MINE-SNG", "name": "Singrauli OpenCast Mega Mine", "type": "OPEN_CAST", "op": "Bharat Coal Enterprises", "reg": "DGMS/REG/2018/0091", "lat": 24.1992, "lng": 82.6645, "comp": 92.4, "risk": 38.5, "tier": "MEDIUM", "org": org1.id, "sub": sub1.id, "reg_id": reg1.id, "mgr": "Rajeshwar Singh"},
        {"code": "MINE-JHR", "name": "Jharia Underground Seam 4", "type": "UNDERGROUND", "op": "Bharat Coal Enterprises", "reg": "DGMS/REG/2015/0412", "lat": 23.7523, "lng": 86.4182, "comp": 84.2, "risk": 74.0, "tier": "CRITICAL", "org": org1.id, "sub": sub2.id, "reg_id": reg3.id, "mgr": "Vikramaditya Bose"},
        {"code": "MINE-KRB", "name": "Korba West Open Pit", "type": "OPEN_CAST", "op": "Deccan Mining Corp", "reg": "DGMS/REG/2020/1105", "lat": 22.3595, "lng": 82.7501, "comp": 96.0, "risk": 19.5, "tier": "LOW", "org": org2.id, "sub": sub3.id, "reg_id": reg2.id, "mgr": "Anand Rao"},
        {"code": "MINE-RNG", "name": "Raniganj Deep Coal Mine", "type": "UNDERGROUND", "op": "Eastern Minerals Ltd", "reg": "DGMS/REG/2012/0023", "lat": 23.6186, "lng": 87.1278, "comp": 89.1, "risk": 52.0, "tier": "HIGH", "org": org3.id, "sub": sub2.id, "reg_id": reg3.id, "mgr": "Subhashish Roy"},
        {"code": "MINE-TLC", "name": "Talcher North Block Pit", "type": "OPEN_CAST", "op": "Bharat Coal Enterprises", "reg": "DGMS/REG/2021/0889", "lat": 20.9509, "lng": 85.2165, "comp": 95.5, "risk": 22.0, "tier": "LOW", "org": org1.id, "sub": sub1.id, "reg_id": reg1.id, "mgr": "Pradeep Mohanty"},
        {"code": "MINE-DHN", "name": "Dhanbad Central Deep Seam", "type": "MIXED", "op": "Bharat Coal Enterprises", "reg": "DGMS/REG/2016/0674", "lat": 23.7957, "lng": 86.4304, "comp": 90.8, "risk": 44.5, "tier": "MEDIUM", "org": org1.id, "sub": sub2.id, "reg_id": reg3.id, "mgr": "Alok Kumar Sinha"}
    ]
    
    created_mines = []
    for md in mines_data:
        m = Mine(
            organization_id=md["org"],
            subsidiary_id=md["sub"],
            region_id=md["reg_id"],
            code=md["code"],
            name=md["name"],
            mine_type=md["type"],
            operator_name=md["op"],
            registration_number=md["reg"],
            latitude=md["lat"],
            longitude=md["lng"],
            compliance_score=md["comp"],
            risk_score=md["risk"],
            risk_tier=md["tier"],
            manager_name=md["mgr"],
            status="OPERATIONAL"
        )
        db.add(m)
        created_mines.append(m)
    db.commit()
    
    mine1 = created_mines[0] # Singrauli
    mine2 = created_mines[1] # Jharia (Critical watch)
    
    # Mine Zones
    zone_types = [
        ("ZONE-NP", "North Extraction Pit", "PIT"),
        ("ZONE-SP", "South Haulage & Pit", "PIT"),
        ("ZONE-CV", "Main Conveyor Gallery 2", "CONVEYOR"),
        ("ZONE-BL", "Deep Seam Blasting Zone", "BLASTING")
    ]
    created_zones = []
    for m in created_mines:
        for zcode, zname, ztype in zone_types:
            mz = MineZone(
                mine_id=m.id,
                code=f"{m.code}-{zcode}",
                name=f"{m.name} - {zname}",
                zone_type=ztype,
                risk_tier="HIGH" if "NP" in zcode and m.id == mine1.id else "LOW",
                latitude=m.latitude + random.uniform(-0.005, 0.005),
                longitude=m.longitude + random.uniform(-0.005, 0.005)
            )
            db.add(mz)
            created_zones.append(mz)
    db.commit()
    
    zone_north_pit = created_zones[0]
    
    # 3. Roles & Users (Demo Accounts)
    print("[Seed] Seeding Demo Accounts with Scopes...")
    users_data = [
        {"email": "supervisor@bharatcoal.in", "name": "Ramesh Kumar Sharma", "role": "FIELD_SUPERVISOR", "pass": "Field@2026", "mine": mine1.id, "zone": zone_north_pit.id, "org": org1.id},
        {"email": "manager@bharatcoal.in", "name": "Rajeshwar Singh", "role": "MINE_MANAGER", "pass": "Manager@2026", "mine": mine1.id, "zone": None, "org": org1.id},
        {"email": "executive@bharatcoal.in", "name": "Dr. Amitabh Sengupta", "role": "CORPORATE_EXECUTIVE", "pass": "Corporate@2026", "mine": None, "zone": None, "org": org1.id},
        {"email": "regulator@gov.in", "name": "Sunil V. Pillai, IRS", "role": "GOVERNMENT_REGULATOR", "group": "REGULATORY_OFFICER", "pass": "Gov@2026", "jurisdiction": "DGMS-EAST-01"},
        {"email": "senior.regulator@gov.in", "name": "Meera Swaminathan, DDG", "role": "GOVERNMENT_REGULATOR", "group": "SENIOR_REGULATORY_OFFICER", "pass": "GovSenior@2026", "jurisdiction": "DGMS-NATIONAL"},
        {"email": "admin.regulator@gov.in", "name": "P. K. Verma", "role": "GOVERNMENT_REGULATOR", "group": "REGULATORY_ADMIN", "pass": "GovAdmin@2026", "jurisdiction": "DGMS-HQ"},
        {"email": "analytics.regulator@gov.in", "name": "Kavita Deshmukh", "role": "GOVERNMENT_REGULATOR", "group": "ANALYTICS_POLICY_USER", "pass": "GovAnalytics@2026", "jurisdiction": "DGMS-POLICY"}
    ]
    
    created_users = {}
    for ud in users_data:
        u = User(
            email=ud["email"],
            full_name=ud["name"],
            role_code=ud["role"],
            gov_permission_group=ud.get("group"),
            hashed_password=get_password_hash(ud["pass"]),
            organization_id=ud.get("org"),
            mine_id=ud.get("mine"),
            mine_zone_id=ud.get("zone"),
            jurisdiction_code=ud.get("jurisdiction"),
            badge_number=f"BDG-{random.randint(1000, 9999)}",
            is_active=True
        )
        db.add(u)
        created_users[ud["role"]] = u
    db.commit()
    
    supervisor_user = created_users["FIELD_SUPERVISOR"]
    manager_user = created_users["MINE_MANAGER"]
    corporate_user = created_users["CORPORATE_EXECUTIVE"]
    regulator_user = created_users["GOVERNMENT_REGULATOR"]
    
    # 4. Contractors & Heavy Machinery (25 Machines, 6 Contractors)
    print("[Seed] Seeding 25 Heavy Machines and 6 Contractors...")
    contractors_data = [
        {"code": "CON-2026-01", "name": "Vindhya Earthmovers & Haulage Ltd", "dept": "Haulage", "risk": 22.0, "comp": 96.0},
        {"code": "CON-2026-02", "name": "Apex Mining Services & Drilling", "dept": "Drilling", "risk": 68.5, "comp": 78.0},
        {"code": "CON-2026-03", "name": "Shakti Electrical Engineering Corp", "dept": "Electrical Installation", "risk": 74.0, "comp": 71.5},
        {"code": "CON-2026-04", "name": "Eastern Conveyor Support Services", "dept": "Maintenance", "risk": 34.0, "comp": 92.0},
        {"code": "CON-2026-05", "name": "Ganga Water & Dust Suppression", "dept": "Environment", "risk": 15.0, "comp": 98.0},
        {"code": "CON-2026-06", "name": "Reliable Industrial Logistics", "dept": "Logistics", "risk": 41.0, "comp": 87.0}
    ]
    created_contractors = []
    for cd in contractors_data:
        c = Contractor(
            mine_id=mine1.id,
            code=cd["code"],
            company_name=cd["name"],
            contact_person="R. K. Gupta",
            phone="+91 98300 12345",
            email="contracts@" + cd["name"].split()[0].lower() + ".com",
            department=cd["dept"],
            contract_start=datetime.date(2025, 1, 1),
            contract_end=datetime.date(2026, 12, 31),
            risk_score=cd["risk"],
            compliance_score=cd["comp"],
            risk_tier="CRITICAL" if cd["risk"] >= 70 else ("HIGH" if cd["risk"] >= 50 else "LOW"),
            status="ACTIVE"
        )
        db.add(c)
        created_contractors.append(c)
    db.commit()
    
    # 25 Machines
    machine_types = [
        ("Shovel-Excavator 10m3", "Excavator"),
        ("Heavy Dragline Walking 24m3", "Dragline"),
        ("CAT 777D 100T Dumper", "Dumper"),
        ("Komatsu HD785 Dumper", "Dumper"),
        ("High-Capacity Continuous Miner", "Continuous Miner"),
        ("Heavy Overland Conveyor Drive", "Conveyor System"),
        ("Main Exhaust Ventilation Fan", "Ventilation Fan")
    ]
    created_machines = []
    for idx in range(1, 26):
        m_name, m_type = machine_types[idx % len(machine_types)]
        status = "OPERATIONAL"
        if idx == 4:
            status = "CRITICAL" # EX-204
        elif idx in [8, 15]:
            status = "MAINTENANCE_DUE"
        elif idx == 12:
            status = "WARNING"
            
        m = Machine(
            mine_id=mine1.id if idx <= 15 else mine2.id,
            mine_zone_id=zone_north_pit.id if idx <= 15 else created_zones[4].id,
            machine_id=f"MCH-2026-{idx:03d}",
            name=f"{m_name} #{idx:02d}",
            machine_type=m_type,
            status=status,
            operating_hours=1200.0 + idx * 85.5,
            last_maintenance=datetime.date.today() - datetime.timedelta(days=45),
            next_maintenance=datetime.date.today() + datetime.timedelta(days=15 if status == "OPERATIONAL" else -3),
            maintenance_status="OVERDUE" if status in ["CRITICAL", "MAINTENANCE_DUE"] else "UP_TO_DATE",
            risk_status="HIGH" if status in ["CRITICAL", "MAINTENANCE_DUE"] else "LOW",
            temperature_celsius=98.5 if status == "CRITICAL" else 65.0,
            vibration_level=4.8 if status == "CRITICAL" else 1.2,
            predicted_maintenance_window="Immediate attention required (Bearing overheating)" if status == "CRITICAL" else "Within normal operating parameters",
            recommended_action="Inspect bearing assembly and lube circulation" if status == "CRITICAL" else "Routine inspection at next shift"
        )
        db.add(m)
        created_machines.append(m)
    db.commit()
    
    # 5. Workers & Attendance (60 Workers)
    print("[Seed] Seeding 60 Active Workers across shifts...")
    roles = ["Excavator Operator", "Heavy Dumper Driver", "High Voltage Electrician", "Blasting Foreman", "Ventilation Technician", "Safety Marshall"]
    departments = ["Excavation", "Haulage", "Electrical", "Blasting", "Ventilation", "Safety"]
    created_workers = []
    for idx in range(1, 61):
        r_idx = idx % len(roles)
        w = Worker(
            worker_id=f"WRK-2026-{idx:03d}",
            name=f"Worker {idx:02d} ({roles[r_idx]})",
            mine_id=mine1.id if idx <= 35 else mine2.id,
            mine_zone_id=zone_north_pit.id if idx <= 35 else created_zones[4].id,
            department=departments[r_idx],
            role=roles[r_idx],
            shift="SHIFT_A" if idx % 3 == 0 else ("SHIFT_B" if idx % 3 == 1 else "SHIFT_C"),
            status="ACTIVE",
            training_status="OVERDUE" if idx in [7, 19, 42] else "CERTIFIED",
            certification_status="EXPIRING_SOON" if idx in [5, 23] else "VALID"
        )
        db.add(w)
        created_workers.append(w)
    db.commit()
    
    # Today's attendance
    for idx, w in enumerate(created_workers[:35]):
        att_status = "ABSENT" if idx in [3, 11] else ("LATE" if idx == 6 else "PRESENT")
        db.add(Attendance(
            worker_id=w.id,
            mine_id=mine1.id,
            date=datetime.date.today(),
            shift=w.shift,
            status=att_status,
            recorded_by_id=supervisor_user.id
        ))
    db.commit()
    
    # 6. Inspection Templates & Connected End-to-End Workflow
    print("[Seed] Seeding Inspection Checklist Templates & Connected Scenarios...")
    tmpl_elec = InspectionTemplate(
        code="TMPL-ELEC-PIT",
        name="High-Voltage Pit Electrical & Substation Safety",
        inspection_type="ELECTRICAL",
        description="Comprehensive audit of trailing cables, transformers, switchgear, and grounding under DGMS CMR 2017.",
        regulatory_reference="DGMS Circular 04 of 2024 / Regulation 102"
    )
    tmpl_vent = InspectionTemplate(
        code="TMPL-VENT-UG",
        name="Underground Gas & Ventilation Monitoring",
        inspection_type="VENTILATION",
        description="Methane concentration, airflow velocity, and auxiliary fan checks.",
        regulatory_reference="DGMS CMR Regulation 153"
    )
    db.add_all([tmpl_elec, tmpl_vent])
    db.commit()
    
    items_elec = [
        ("PPE", "ELEC-01", "Flame-Retardant PPE & Insulated Gloves", "Inspect certified 11kV dielectric gloves and arc flash suit"),
        ("Electrical", "ELEC-02", "Trailing Cable Armor & Conduit Integrity", "Verify no exposed copper strands, cuts, or damaged insulation"),
        ("Electrical", "ELEC-03", "Ground Earth Continuity & Neutral Resistance", "Ensure earth pit resistance below 1.0 Ohm"),
        ("Fire", "ELEC-04", "CO2 & Dry Powder Fire Suppression at Substation", "Check gauge pressure and inspection tags")
    ]
    for cat, code, title, desc in items_elec:
        db.add(InspectionItem(
            template_id=tmpl_elec.id,
            category=cat,
            item_code=code,
            title=title,
            requirement_description=desc
        ))
    db.commit()
    
    # 7. Connected Scenario: Inspection -> Finding -> Violation -> Corrective Action -> Evidence -> Verification -> Closure
    print("[Seed] Creating connected demo lifecycle (Electrical Conduit in North Pit)...")
    
    # Scenario A: Completed & Verified action
    insp1 = Inspection(
        inspection_id="INSP-2026-0041",
        template_id=tmpl_elec.id,
        mine_id=mine1.id,
        mine_zone_id=zone_north_pit.id,
        inspection_type="ELECTRICAL",
        priority="HIGH",
        scheduled_date=datetime.date.today() - datetime.timedelta(days=3),
        created_by_role="MINE_MANAGER",
        created_by_id=manager_user.id,
        assigned_supervisor_id=supervisor_user.id,
        instructions="Inspect high-voltage trailing lines feeding Shovel-04 in North Pit.",
        status="SUBMITTED",
        started_at=datetime.datetime.utcnow() - datetime.timedelta(days=3, hours=4),
        completed_at=datetime.datetime.utcnow() - datetime.timedelta(days=3, hours=2),
        start_latitude=24.1988,
        start_longitude=82.6651,
        checklist_results=[
            {"category": "PPE", "title": "Flame-Retardant PPE", "status": "COMPLIANT"},
            {"category": "Electrical", "title": "Trailing Cable Armor & Conduit Integrity", "status": "NON_COMPLIANT", "severity": "CRITICAL", "remarks": "Exposed 6.6kV copper core detected near Shovel track."}
        ]
    )
    db.add(insp1)
    db.commit()
    
    fnd1 = InspectionFinding(
        finding_id="FND-2026-0012",
        inspection_id=insp1.id,
        mine_id=mine1.id,
        mine_zone_id=zone_north_pit.id,
        item_category="Electrical Safety",
        item_title="Exposed 6.6kV Trailing Cable Conduit",
        description="6.6kV trailing cable conduit crushed by haul truck tire; protective armor ruptured exposing live energized insulation.",
        severity="CRITICAL",
        latitude=24.1988,
        longitude=82.6651,
        evidence_photo_url="/uploads/demo_electrical_hazard.jpg",
        remarks="Immediate isolation of North Pit feeder required."
    )
    db.add(fnd1)
    db.commit()
    
    vio1 = Violation(
        violation_id="VIO-2026-0089",
        mine_id=mine1.id,
        mine_zone_id=zone_north_pit.id,
        inspection_id=insp1.id,
        finding_id=fnd1.id,
        contractor_id=created_contractors[2].id, # Shakti Electrical
        category="Electrical Safety",
        description="Failure to protect high-voltage trailing cables from mechanical damage on active haulage route under Regulation 102.",
        severity="CRITICAL",
        department="Electrical",
        responsible_person="Praveen Chawla (Lead Electrical Eng)",
        deadline=datetime.date.today() + datetime.timedelta(days=2),
        status="AWAITING_VERIFICATION",
        is_recurring=True,
        recurrence_count=3
    )
    db.add(vio1)
    db.commit()
    
    act1 = CorrectiveAction(
        action_id="ACT-2026-0142",
        source_type="VIOLATION",
        violation_id=vio1.id,
        inspection_id=insp1.id,
        mine_id=mine1.id,
        mine_zone_id=zone_north_pit.id,
        description="De-energize feeder, replace crushed 6.6kV cable section with armored conduit, and build overhead flyover crossing.",
        assigned_person="Ramesh Kumar Sharma (Field Team)",
        assigned_user_id=supervisor_user.id,
        department="Electrical",
        priority="CRITICAL",
        severity="CRITICAL",
        deadline=datetime.date.today() + datetime.timedelta(days=2),
        requires_gov_verification=True,
        status="AWAITING_VERIFICATION"
    )
    db.add(act1)
    db.commit()
    
    # Pre-seeded evidence uploaded by Field (awaiting verification demo!)
    ev1 = CorrectiveActionEvidence(
        action_id=act1.id,
        uploaded_by_id=supervisor_user.id,
        file_path="/uploads/demo_repaired_conduit.jpg",
        file_type="IMAGE",
        remarks="Replaced 40m conduit section with vulcanized splice and installed elevated steel bridge protector. Feeder megger tested 150 MOhm.",
        latitude=24.1988,
        longitude=82.6651
    )
    db.add(ev1)
    db.commit()
    
    # 8. Additional realistic Violations & Overdue Actions (35+ Violations, 30+ Actions)
    print("[Seed] Seeding 35+ Violations and 30+ Actions across mines...")
    categories = [
        ("Electrical Safety", "CRITICAL", "Electrical"),
        ("Conveyor Guarding", "HIGH", "Maintenance"),
        ("Haul Road Berm Height", "HIGH", "Excavation"),
        ("Dust Suppression Inadequacy", "MEDIUM", "Environment"),
        ("PPE Non-Compliance", "MEDIUM", "Safety"),
        ("Blasting Danger Zone Warning", "CRITICAL", "Blasting"),
        ("Underground Methane Sensor Calibration", "CRITICAL", "Ventilation")
    ]
    
    for i in range(1, 35):
        cat, sev, dept = categories[i % len(categories)]
        m_target = mine1 if i % 2 == 0 else (mine2 if i % 3 == 0 else created_mines[2])
        is_overdue = (i in [3, 7, 14, 22])
        v_status = "OPEN" if i % 2 == 0 else "IN_REMEDIATION"
        
        v = Violation(
            violation_id=f"VIO-2026-{100+i:04d}",
            mine_id=m_target.id,
            mine_zone_id=zone_north_pit.id if m_target.id == mine1.id else None,
            category=cat,
            description=f"Non-compliance finding in {cat}: Defect observed during inspection routine #{i}.",
            severity=sev,
            department=dept,
            deadline=datetime.date.today() - datetime.timedelta(days=4) if is_overdue else datetime.date.today() + datetime.timedelta(days=i*2),
            status="ESCALATED" if is_overdue else v_status,
            is_recurring=cat in ["Electrical Safety", "Conveyor Guarding"]
        )
        db.add(v)
        
        # Companion Corrective Action
        a = CorrectiveAction(
            action_id=f"ACT-2026-{200+i:04d}",
            source_type="VIOLATION",
            violation_id=v.id,
            mine_id=m_target.id,
            description=f"Remedial engineering works for {cat} at {m_target.name}.",
            assigned_person=f"Engineer {dept} Division",
            department=dept,
            priority=sev,
            severity=sev,
            deadline=v.deadline,
            is_overdue=is_overdue,
            is_escalated=is_overdue,
            status="OVERDUE" if is_overdue else "ASSIGNED"
        )
        db.add(a)
    db.commit()
    
    # 9. Incidents (50+ Incidents) & Safety Observations (50+ Observations)
    print("[Seed] Seeding 50+ Incidents and 50+ Safety Observations...")
    inc_types = ["Accident", "Dangerous Occurrence", "Equipment Failure", "Near Miss", "Fire", "Environmental Incident"]
    for i in range(1, 55):
        itype = inc_types[i % len(inc_types)]
        m_target = created_mines[i % len(created_mines)]
        sev = "CRITICAL" if i in [4, 18, 33] else ("HIGH" if i % 2 == 0 else "MEDIUM")
        inc = Incident(
            incident_id=f"INC-2026-{i:04d}",
            mine_id=m_target.id,
            incident_type=itype,
            incident_datetime=datetime.datetime.utcnow() - datetime.timedelta(days=i * 2, hours=random.randint(1, 23)),
            location_details=f"Pit Sector {i % 4 + 1} Haul Ramp",
            description=f"Reported {itype.lower()} involving mechanical operations and haulage equipment.",
            severity=sev,
            status="UNDER_INVESTIGATION" if sev == "CRITICAL" else ("RESOLVED" if i > 25 else "OPEN"),
            reported_by_id=supervisor_user.id
        )
        db.add(inc)
        
        # Companion safety observation
        db.add(SafetyObservation(
            observation_id=f"OBS-2026-{i:04d}",
            mine_id=m_target.id,
            category=categories[i % len(categories)][0],
            description=f"Field safety observation recorded at active workfront: {categories[i % len(categories)][0]}.",
            severity=sev,
            reported_by_id=supervisor_user.id,
            status="OPEN" if i < 20 else "CLOSED"
        ))
    db.commit()
    
    # 10. Environmental Readings & Breaches (100+ Readings)
    print("[Seed] Seeding Environmental Telemetry & Breaches...")
    metrics = [
        ("PM2.5", "ug/m3", 60.0, 42.0),
        ("PM10", "ug/m3", 100.0, 85.0),
        ("Methane (CH4)", "%", 0.75, 0.22),
        ("Carbon Monoxide (CO)", "ppm", 25.0, 8.0),
        ("Noise Level", "dB", 85.0, 78.0),
        ("Groundwater pH", "pH", 8.5, 7.2)
    ]
    for i in range(1, 100):
        m_name, unit, thresh, normal = metrics[i % len(metrics)]
        m_target = mine1 if i % 2 == 0 else mine2
        is_breach = (i in [6, 24, 52])
        val = thresh + 18.5 if is_breach else normal + random.uniform(-5.0, 8.0)
        db.add(EnvironmentalReading(
            mine_id=m_target.id,
            metric_name=m_name,
            value=round(val, 2),
            unit=unit,
            threshold_limit=thresh,
            is_breach=is_breach,
            status="CRITICAL" if is_breach else "NORMAL",
            location_details=f"Continuous Sensor Station #{i % 5 + 1}",
            timestamp=datetime.datetime.utcnow() - datetime.timedelta(hours=i * 4)
        ))
    db.commit()
    
    # 11. Documents (100+ Records with OCR Data)
    print("[Seed] Seeding 100+ Compliance Documents and OCR Vault Records...")
    doc_cats = ["CERTIFICATES", "INSPECTION_REPORTS", "APPROVAL_DOCS", "COMPLIANCE_EVIDENCE", "SAFETY_DOCS", "CONTRACTOR_DOCS", "MACHINE_DOCS"]
    for i in range(1, 105):
        dcat = doc_cats[i % len(doc_cats)]
        m_target = created_mines[i % len(created_mines)]
        doc = Document(
            doc_id=f"DOC-2026-{i:04d}",
            title=f"Statutory Document {dcat.replace('_', ' ').title()} #{i:03d}",
            category=dcat,
            mine_id=m_target.id,
            file_path=f"/uploads/DOC-2026-{i:04d}.pdf",
            file_name=f"DOC-2026-{i:04d}.pdf",
            file_size_bytes=random.randint(150000, 2400000),
            issue_date=datetime.date.today() - datetime.timedelta(days=180),
            expiry_date=datetime.date.today() - datetime.timedelta(days=10) if i in [5, 18, 77] else datetime.date.today() + datetime.timedelta(days=200),
            status="EXPIRED" if i in [5, 18, 77] else "VALID",
            uploaded_by_id=manager_user.id
        )
        db.add(doc)
        db.flush()
        
        db.add(DocumentOCRData(
            document_id=doc.id,
            raw_text=f"Official DGMS Statutory Certification for {m_target.name}. Document Reference: DGMS/CERT/{i:04d}.",
            doc_number=f"DGMS/CERT/2026/{i:04d}",
            extracted_issue_date=doc.issue_date,
            extracted_expiry_date=doc.expiry_date,
            issuing_authority="Directorate General of Mines Safety (DGMS)",
            confidence_score=0.96
        ))
    db.commit()
    
    # 12. Regulatory Actions & Government Applications
    print("[Seed] Seeding Regulatory Actions & Applications...")
    reg_action1 = RegulatoryAction(
        action_id="REG-2026-0019",
        mine_id=mine1.id,
        organization_id=org1.id,
        source_violation_id=vio1.id,
        action_type="REGULATORY_DIRECTION",
        description="Statutory Directive under Section 22(3) of Mines Act 1952: Rectify all unarmored cable crossings and submit engineering compliance report.",
        issued_by="Directorate General of Mines Safety (DGMS)",
        issued_by_user_id=regulator_user.id,
        issue_date=datetime.date.today() - datetime.timedelta(days=2),
        deadline=datetime.date.today() + datetime.timedelta(days=7),
        required_evidence="Engineering line diagram, photos of armored bridge crossing, and insulation resistance logs.",
        status="ISSUED"
    )
    db.add(reg_action1)
    
    app1 = RegulatoryApplication(
        application_id="APP-2026-0008",
        mine_id=mine1.id,
        organization_id=org1.id,
        application_type="EXPLOSIVE_STORAGE_LICENSE",
        applicant_name="Rajeshwar Singh",
        applicant_designation="Mine Agent & Manager",
        description="Application for statutory renewal of 50-Tonne Class-2 Bulk Emulsion explosive magazine at Singrauli North Pit.",
        review_status="PENDING"
    )
    db.add(app1)
    db.commit()
    
    # 13. Corporate Safety Initiatives
    print("[Seed] Seeding Corporate Initiatives...")
    init1 = SafetyInitiative(
        initiative_id="INIT-2026-001",
        title="Zero Electrical Hazard Campaign 2026",
        description="Organization-wide statutory compliance drive targeting trailing cables, switchgear isolation, and earth leakage relays across all 6 operating mines.",
        scope="ALL_MINES",
        organization_id=org1.id,
        start_date=datetime.date(2026, 1, 1),
        end_date=datetime.date(2026, 12, 31),
        inspections_target=120,
        inspections_completed=48,
        violations_resolved=29,
        compliance_target_pct=98.0,
        lead_executive_name="Dr. Amitabh Sengupta",
        status="ACTIVE"
    )
    db.add(init1)
    db.commit()
    
    # 14. Pre-calculated AI Patterns & Predictions
    print("[Seed] Seeding AI Recurring Patterns & Predictions...")
    db.add(AIRecurringPattern(
        pattern_id="PAT-2026-0001",
        category="Electrical Safety",
        title="Cross-Mine Electrical Trailing Cable Vulnerability",
        description="Repeated trailing cable armor punctures detected across Singrauli OpenCast and Jharia Underground.",
        occurrence_count=14,
        affected_mines_count=2,
        affected_mines_data=[{"mine_id": mine1.id, "mine_name": mine1.name, "count": 9}, {"mine_id": mine2.id, "mine_name": mine2.name, "count": 5}],
        affected_zones_count=4,
        trend="INCREASING",
        evidence_summary="14 violations linked to mechanical vehicle impact on high-voltage lines.",
        recommended_campaign="Zero Electrical Hazard Campaign"
    ))
    
    db.add(AIRecommendation(
        recommendation_id="REC-2026-001",
        mine_id=mine1.id,
        mine_zone_id=zone_north_pit.id,
        category="Electrical Safety",
        title="Schedule Specialized Electrical Pit Inspection",
        recommendation_text="Electrical hazards have increased by 45% in North Pit over the last 14 days. Recommend scheduling an immediate high-voltage trailing cable audit.",
        justification="3 unresolved electrical findings in Zone North Pit.",
        priority="HIGH",
        action_type="CREATE_INSPECTION",
        action_payload={"template_code": "TMPL-ELEC-PIT", "priority": "HIGH", "zone_id": zone_north_pit.id}
    ))
    db.commit()
    
    # 15. Notifications & Audit Logs for Demo
    print("[Seed] Seeding Notifications & Audit Trail Chain...")
    create_notification_record(db, supervisor_user.id, "New Inspection Assigned", "You have been assigned High-Voltage Pit Electrical Inspection (INSP-2026-0041)", "ASSIGNMENT", "HIGH")
    create_notification_record(db, manager_user.id, "Verification Required: ACT-2026-0142", "Field team has uploaded repair evidence for 6.6kV cable conduit. Awaiting verification.", "VERIFICATION_REQUEST", "CRITICAL")
    create_notification_record(db, corporate_user.id, "AI Recurring Hazard Alert", "Cross-mine electrical safety pattern detected across 2 mines (14 occurrences).", "CRITICAL_ALERT", "HIGH")
    create_notification_record(db, regulator_user.id, "Statutory Notice Awaiting Response", "Directive REG-2026-0019 issued to Singrauli OpenCast requires review.", "CRITICAL_ALERT", "CRITICAL")
    
    # Audit log chain entries
    for u in [supervisor_user, manager_user, corporate_user, regulator_user]:
        record_audit_event(db, u, "USER", str(u.id), "LOGIN", {"auth_method": "PASSWORD_HASH"})
    record_audit_event(db, supervisor_user, "INSPECTION", insp1.inspection_id, "SUBMIT_INSPECTION", {"findings_count": 1})
    record_audit_event(db, manager_user, "VIOLATION", vio1.violation_id, "CONVERT_FROM_FINDING", {"finding_id": fnd1.finding_id})
    record_audit_event(db, supervisor_user, "CORRECTIVE_ACTION", act1.action_id, "SUBMIT_EVIDENCE", {"status": "AWAITING_VERIFICATION"})
    record_audit_event(db, regulator_user, "REGULATORY_ACTION", reg_action1.action_id, "ISSUE_DIRECTIVE", {"mine_id": mine1.id})
    
    print("[Seed] Successfully seeded complete realistic dataset with connected workflows and cryptographic audit chain!")
    db.close()

def create_notification_record(db, user_id, title, msg, ntype, priority):
    notif = Notification(
        user_id=user_id,
        title=title,
        message=msg,
        notification_type=ntype,
        priority=priority,
        is_read=False
    )
    db.add(notif)
    db.commit()

if __name__ == "__main__":
    seed_database()
