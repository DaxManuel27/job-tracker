import re
import base64
from datetime import datetime
from typing import Optional
from app.models import JobStatus


# Common job board domains and their names
JOB_SOURCES = {
    "linkedin.com": "LinkedIn",
    "indeed.com": "Indeed",
    "glassdoor.com": "Glassdoor",
    "lever.co": "Lever",
    "greenhouse.io": "Greenhouse",
    "workday.com": "Workday",
    "jobs.ashbyhq.com": "Ashby",
    "smartrecruiters.com": "SmartRecruiters",
    "icims.com": "iCIMS",
    "myworkdayjobs.com": "Workday",
}

# Patterns to identify job-related emails and extract info
STATUS_PATTERNS = {
    JobStatus.REJECTED: [
        r"we (have |)decided (to |)not (to |)move forward",
        r"we (will |)won't be (moving|proceeding) forward",
        r"unfortunately",
        r"not selected",
        r"position has been filled",
        r"we've decided to pursue other candidates",
        r"after careful consideration",
    ],
    JobStatus.INTERVIEWING: [
        r"schedule (a |an |your )interview",
        r"interview (invitation|request)",
        r"like to invite you",
        r"next (round|step|stage)",
        r"phone screen",
        r"technical assessment",
    ],
    JobStatus.OFFER: [
        r"pleased to offer",
        r"offer (letter|of employment)",
        r"congratulations",
        r"welcome to the team",
    ],
    JobStatus.APPLIED: [
        r"(received|got) your application",
        r"thank you for (applying|your (interest|application))",
        r"application (received|confirmed|submitted)",
    ],
}


def get_header(headers: list, name: str) -> Optional[str]:
    """Extract header value from Gmail message headers."""
    for header in headers:
        if header["name"].lower() == name.lower():
            return header["value"]
    return None


def decode_body(data: str) -> str:
    """Decode base64 encoded email body."""
    try:
        return base64.urlsafe_b64decode(data).decode("utf-8")
    except Exception:
        return ""


def get_email_body(payload: dict) -> str:
    """Extract text body from email payload."""
    body = ""
    
    if "body" in payload and payload["body"].get("data"):
        body = decode_body(payload["body"]["data"])
    elif "parts" in payload:
        for part in payload["parts"]:
            if part["mimeType"] == "text/plain" and part["body"].get("data"):
                body += decode_body(part["body"]["data"])
            elif "parts" in part:
                # Handle nested parts
                body += get_email_body(part)
    
    return body


def extract_company_from_email(from_header: str, subject: str, body: str) -> str:
    """Try to extract company name from email."""
    # Try to get from the "From" header
    # Format: "Company Name <email@company.com>" or just "email@company.com"
    match = re.match(r'^"?([^"<]+)"?\s*<', from_header)
    if match:
        company = match.group(1).strip()
        # Filter out generic names
        if company.lower() not in ["no-reply", "noreply", "careers", "jobs", "recruiting", "talent"]:
            return company
    
    # Try to extract from email domain
    email_match = re.search(r'@([a-zA-Z0-9-]+)\.(com|io|co|org)', from_header)
    if email_match:
        domain = email_match.group(1)
        # Convert domain to company name (capitalize, handle common patterns)
        if domain.lower() not in ["gmail", "yahoo", "outlook", "hotmail"]:
            return domain.replace("-", " ").title()
    
    return "Unknown Company"


def extract_position_from_subject(subject: str, body: str) -> str:
    """Try to extract job position from subject or body."""
    # Common patterns in subject lines
    patterns = [
        r"application for[:\s]+(.+?)(?:\s+at|\s+-|\s*$)",
        r"re:\s*(.+?)\s+(?:application|position|role)",
        r"(.+?)\s+(?:application|position|role)\s+(?:received|confirmed|status)",
        r"your application[:\s]+(.+?)(?:\s+at|\s+-|\s*$)",
    ]
    
    for pattern in patterns:
        match = re.search(pattern, subject, re.IGNORECASE)
        if match:
            position = match.group(1).strip()
            if len(position) > 3 and len(position) < 100:
                return position
    
    return "Unknown Position"


def detect_status(subject: str, body: str) -> JobStatus:
    """Detect job application status from email content."""
    text = f"{subject} {body}".lower()
    
    # Check patterns in order of specificity
    for status, patterns in STATUS_PATTERNS.items():
        for pattern in patterns:
            if re.search(pattern, text, re.IGNORECASE):
                return status
    
    return JobStatus.APPLIED


def detect_source(from_header: str) -> Optional[str]:
    """Detect job board source from email sender."""
    from_lower = from_header.lower()
    
    for domain, source in JOB_SOURCES.items():
        if domain in from_lower:
            return source
    
    return None


def parse_email_date(internal_date: str) -> Optional[datetime]:
    """Parse Gmail internal date (milliseconds since epoch)."""
    try:
        timestamp = int(internal_date) / 1000
        return datetime.fromtimestamp(timestamp)
    except Exception:
        return None


def parse_job_email(message: dict) -> Optional[dict]:
    """Parse a Gmail message and extract job application data."""
    try:
        payload = message.get("payload", {})
        headers = payload.get("headers", [])
        
        from_header = get_header(headers, "From") or ""
        subject = get_header(headers, "Subject") or ""
        body = get_email_body(payload)
        
        # Skip if not job-related (basic check)
        text = f"{subject} {body}".lower()
        job_keywords = ["application", "applied", "position", "role", "job", "interview", "candidate"]
        if not any(keyword in text for keyword in job_keywords):
            return None
        
        return {
            "company": extract_company_from_email(from_header, subject, body),
            "position": extract_position_from_subject(subject, body),
            "status": detect_status(subject, body),
            "source": detect_source(from_header),
            "date": parse_email_date(message.get("internalDate", "")),
        }
        
    except Exception as e:
        print(f"Error parsing email: {e}")
        return None


