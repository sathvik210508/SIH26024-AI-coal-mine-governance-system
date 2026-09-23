export type RoleCode = 
  | "FIELD_SUPERVISOR"
  | "MINE_MANAGER"
  | "CORPORATE_EXECUTIVE"
  | "GOVERNMENT_REGULATOR";

export interface User {
  id: number;
  email: string;
  full_name: string;
  role_code: RoleCode;
  gov_permission_group?: string | null;
  organization_id?: number | null;
  organization_name?: string | null;
  mine_id?: number | null;
  mine_name?: string | null;
  jurisdiction_code?: string | null;
}

export interface AuthResponse {
  access_token: string;
  token_type: string;
  user: User;
}

export interface Mine {
  id: number;
  code: string;
  name: string;
  mine_type: string;
  status: string;
  compliance_score: number;
  risk_score: number;
  risk_tier: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  manager?: string;
  registration?: string;
  latitude: number;
  longitude: number;
  open_violations?: number;
  overdue_actions?: number;
  incidents_count?: number;
  organization?: string;
  region?: string;
}

export interface Worker {
  id: number;
  worker_id: string;
  name: string;
  department: string;
  role: string;
  shift: string;
  status: string;
  training_status: string;
  certification_status: string;
}

export interface Attendance {
  id: number;
  worker_id: number;
  date: string;
  shift: string;
  status: string;
  remarks?: string;
  worker?: Worker;
}

export interface Machine {
  id: number;
  machine_id: string;
  name: string;
  machine_type: string;
  status: string;
  operating_hours: number;
  maintenance_status: string;
  risk_status: string;
  temperature_celsius?: number;
  vibration_level?: number;
  predicted_maintenance_window?: string;
  recommended_action?: string;
}

export interface Contractor {
  id: number;
  code: string;
  company_name: string;
  department: string;
  contact_person: string;
  phone: string;
  email: string;
  risk_score: number;
  compliance_score: number;
  risk_tier: string;
  status: string;
}

export interface InspectionItem {
  id: number;
  item_code: string;
  category: string;
  title: string;
  requirement_description: string;
}

export interface Inspection {
  id: number;
  inspection_id: string;
  template_id?: number;
  mine_id: number;
  inspection_type: string;
  priority: string;
  scheduled_date: string;
  created_by_role: string;
  status: string;
  instructions?: string;
  regulatory_reference?: string;
  started_at?: string;
  completed_at?: string;
  checklist_results?: Array<{
    category: string;
    title: string;
    status: "COMPLIANT" | "NON_COMPLIANT" | "N/A";
    severity?: string;
    remarks?: string;
    evidence_photo_url?: string;
  }>;
}

export interface InspectionFinding {
  id: number;
  finding_id: string;
  item_category: string;
  item_title: string;
  description: string;
  severity: string;
  evidence_photo_url?: string;
  remarks?: string;
}

export interface SafetyObservation {
  id: number;
  observation_id: string;
  category: string;
  description: string;
  severity: string;
  status: string;
  location_details?: string;
  evidence_photo_url?: string;
  created_at: string;
}

export interface Incident {
  id: number;
  incident_id: string;
  incident_type: string;
  incident_datetime: string;
  description: string;
  severity: string;
  status: string;
  location_details?: string;
  people_involved?: string;
  equipment_involved?: string;
  evidence_photo_url?: string;
}

export interface Violation {
  id: number;
  violation_id: string;
  mine_id: number;
  category: string;
  description: string;
  severity: string;
  department: string;
  deadline: string;
  status: string;
  is_recurring: boolean;
  recurrence_count: number;
  responsible_person?: string;
}

export interface CorrectiveAction {
  id: number;
  action_id: string;
  mine_id: number;
  description: string;
  assigned_person: string;
  department: string;
  priority: string;
  severity: string;
  deadline: string;
  status: string;
  is_overdue: boolean;
  requires_gov_verification?: boolean;
}

export interface ComplianceItem {
  id: number;
  compliance_id: string;
  category: string;
  statutory_body: string;
  requirement: string;
  description: string;
  due_date: string;
  next_due: string;
  status: string;
  priority: string;
}

export interface Document {
  id: number;
  doc_id: string;
  title: string;
  category: string;
  file_path: string;
  issue_date?: string;
  expiry_date?: string;
  status: string;
}

export interface EnvironmentalReading {
  id: number;
  metric_name: string;
  value: number;
  unit: string;
  threshold_limit: number;
  is_breach: boolean;
  status: string;
  location_details?: string;
  timestamp: string;
}

export interface RegulatoryAction {
  id: number;
  action_id: string;
  action_type: string;
  description: string;
  issued_by: string;
  issue_date: string;
  deadline: string;
  status: string;
  required_evidence: string;
}

export interface Notification {
  id: number;
  title: string;
  message: string;
  notification_type: string;
  priority: string;
  is_read: boolean;
  related_entity?: string;
  related_id?: string;
  created_at: string;
}

export interface AIRiskFactor {
  factor: string;
  impact_percentage: number;
  underlying_count: number;
  metric_detail: string;
  trend: string;
  weight: number;
}

export interface AIRiskScore {
  mine_id: number;
  mine_name: string;
  risk_score: number;
  risk_tier: string;
  contributing_factors: AIRiskFactor[];
  summary_explanation: string;
  calculated_at: string;
}

export interface AIRecurringPattern {
  pattern_id: string;
  category: string;
  title: string;
  occurrence_count: number;
  affected_mines_count: number;
  affected_mines: string[];
  trend: string;
  evidence_summary: string;
  recommended_action: string;
}

export interface CopilotResponse {
  answer: string;
  supporting_metrics: Record<string, any>;
  affected_records: Array<{
    id: string;
    type: string;
    title: string;
    status?: string;
    [key: string]: any;
  }>;
  trend: string;
  evidence: string;
}

export interface AuditVerificationResult {
  status: "HASH_CHAIN_VALID" | "INTEGRITY_ISSUE_DETECTED";
  message: string;
  total_blocks: number;
  latest_block_hash?: string;
  broken_event_id?: string;
  verified_at: string;
  recent_blocks?: Array<{
    block_id: number;
    action: string;
    timestamp?: string;
    entity_type?: string;
    user_email?: string;
    block_hash?: string;
  }>;
}
