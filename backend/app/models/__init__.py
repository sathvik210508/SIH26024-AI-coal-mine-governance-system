from app.models.auth import User, Role, Permission, role_permissions, user_permissions
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
from app.models.documents import Document, DocumentVersion, DocumentOCRData
from app.models.regulatory import RegulatoryAction, RegulatoryApplication
from app.models.alerts import Alert, Notification, Escalation
from app.models.ai import AIRiskScore, AIAnomaly, AIRecurringPattern, AIRecommendation, AIPrediction
from app.models.initiatives import SafetyInitiative, TrainingProgram, TrainingParticipation
from app.models.reports import GeneratedReport
from app.models.audit import AuditLog, AuditChainMetadata

__all__ = [
    "User", "Role", "Permission", "role_permissions", "user_permissions",
    "Organization", "Subsidiary", "Region", "Mine", "MineZone",
    "Worker", "WorkerDocument", "Attendance",
    "Machine", "MachineMaintenance", "MachineDocument", "ProductionRecord",
    "Contractor", "ContractorWorker", "ContractorDocument", "ContractorRiskScore",
    "InspectionTemplate", "InspectionItem", "Inspection", "InspectionFinding",
    "SafetyObservation", "Incident", "IncidentInvestigation", "NearMiss",
    "Violation",
    "CorrectiveAction", "CorrectiveActionEvidence", "CorrectiveActionVerification",
    "ComplianceItem", "ComplianceRecord",
    "EnvironmentalReading",
    "Document", "DocumentVersion", "DocumentOCRData",
    "RegulatoryAction", "RegulatoryApplication",
    "Alert", "Notification", "Escalation",
    "AIRiskScore", "AIAnomaly", "AIRecurringPattern", "AIRecommendation", "AIPrediction",
    "SafetyInitiative", "TrainingProgram", "TrainingParticipation",
    "GeneratedReport",
    "AuditLog", "AuditChainMetadata"
]
