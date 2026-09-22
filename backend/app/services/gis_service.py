import math
from typing import Dict, Any, List
from sqlalchemy.orm import Session
from app.models.organization import Mine, MineZone
from app.models.machinery import Machine
from app.models.safety import Incident, SafetyObservation
from app.models.violations import Violation
from app.models.environment import EnvironmentalReading

def build_mine_gis_layers(db: Session, mine_id: int) -> Dict[str, Any]:
    mine = db.query(Mine).filter(Mine.id == mine_id).first()
    if not mine:
        return {}
    
    # Base center
    lat, lng = mine.latitude, mine.longitude
    
    # 1. Mine Boundary Polygon (Demo boundary surrounding mine center)
    delta = 0.015
    boundary_feature = {
        "type": "Feature",
        "properties": {
            "name": f"{mine.name} Concession Boundary",
            "type": "BOUNDARY",
            "risk_tier": mine.risk_tier,
            "status": mine.status
        },
        "geometry": {
            "type": "Polygon",
            "coordinates": [[
                [lng - delta, lat - delta],
                [lng + delta, lat - delta],
                [lng + delta, lat + delta],
                [lng - delta, lat + delta],
                [lng - delta, lat - delta]
            ]]
        }
    }
    
    # 2. Mine Zones
    zones = db.query(MineZone).filter(MineZone.mine_id == mine_id).all()
    zone_features = []
    for idx, z in enumerate(zones):
        z_lat = z.latitude or (lat + (idx * 0.004 - 0.006))
        z_lng = z.longitude or (lng + (idx * 0.004 - 0.006))
        z_delta = 0.003
        zone_features.append({
            "type": "Feature",
            "properties": {
                "id": z.id,
                "code": z.code,
                "name": z.name,
                "zone_type": z.zone_type,
                "risk_tier": z.risk_tier,
                "entity": "ZONE"
            },
            "geometry": {
                "type": "Polygon",
                "coordinates": [[
                    [z_lng - z_delta, z_lat - z_delta],
                    [z_lng + z_delta, z_lat - z_delta],
                    [z_lng + z_delta, z_lat + z_delta],
                    [z_lng - z_delta, z_lat + z_delta],
                    [z_lng - z_delta, z_lat - z_delta]
                ]]
            }
        })
        
    # 3. Machines points
    machines = db.query(Machine).filter(Machine.mine_id == mine_id).all()
    machine_features = []
    for idx, m in enumerate(machines):
        m_lat = m.latitude or (lat + math.sin(idx) * 0.008)
        m_lng = m.longitude or (lng + math.cos(idx) * 0.008)
        machine_features.append({
            "type": "Feature",
            "properties": {
                "id": m.id,
                "machine_id": m.machine_id,
                "name": m.name,
                "type": m.machine_type,
                "status": m.status,
                "risk_status": m.risk_status,
                "entity": "MACHINE"
            },
            "geometry": {
                "type": "Point",
                "coordinates": [m_lng, m_lat]
            }
        })
        
    # 4. Incidents & Violations
    incidents = db.query(Incident).filter(Incident.mine_id == mine_id).all()
    incident_features = []
    for idx, inc in enumerate(incidents):
        i_lat = inc.latitude or (lat + math.sin(idx * 2) * 0.006)
        i_lng = inc.longitude or (lng + math.cos(idx * 2) * 0.006)
        incident_features.append({
            "type": "Feature",
            "properties": {
                "id": inc.id,
                "incident_id": inc.incident_id,
                "type": inc.incident_type,
                "severity": inc.severity,
                "status": inc.status,
                "description": inc.description[:60],
                "entity": "INCIDENT"
            },
            "geometry": {
                "type": "Point",
                "coordinates": [i_lng, i_lat]
            }
        })
        
    # 5. Environmental sensors
    sensors = db.query(EnvironmentalReading).filter(EnvironmentalReading.mine_id == mine_id).all()
    sensor_features = []
    for idx, s in enumerate(sensors[:10]):
        s_lat = s.latitude or (lat + math.sin(idx * 3) * 0.010)
        s_lng = s.longitude or (lng + math.cos(idx * 3) * 0.010)
        sensor_features.append({
            "type": "Feature",
            "properties": {
                "id": s.id,
                "metric": s.metric_name,
                "value": f"{s.value} {s.unit}",
                "threshold": f"{s.threshold_limit} {s.unit}",
                "is_breach": s.is_breach,
                "status": s.status,
                "entity": "ENVIRONMENTAL_SENSOR"
            },
            "geometry": {
                "type": "Point",
                "coordinates": [s_lng, s_lat]
            }
        })

    return {
        "mine": {
            "id": mine.id,
            "name": mine.name,
            "center": [lat, lng],
            "risk_tier": mine.risk_tier,
            "risk_score": mine.risk_score
        },
        "layers": {
            "boundary": boundary_feature,
            "zones": zone_features,
            "machinery": machine_features,
            "incidents": incident_features,
            "environmental": sensor_features
        }
    }
