import re

class DocumentProcessor:
    def __init__(self, text: str):
        self.text = text if text else ""
    
    def extract_all(self):
        return{
            "dates": self.extract_dates(),
            "amounts": self.extract_amounts(),
            "emails" : self.extract_emails()
        }
    
    def extract_dates(self):
        #matches YYYY-MM-DD or DD/MM/YYYY
        date_pattern = r'\b(?:\d{4}[-/]\d{2}[-/]\d{2}|\d{2}[-/]\d{2}[-/]\d{4})\b'
        return list(set(re.findall(date_pattern, self.text)))
    
    def extract_amounts(self):
        # Matches currency patterns like $1,234.56 or 123.45€
        amount_pattern = r'[\$\£\€]?\s?\d+(?:,\d{3})*(?:\.\d{2})?'
        return list(set(re.findall(amount_pattern, self.text)))
    
    def extract_emails(self):
        email_pattern = r'[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}'
        return list(set(re.findall(email_pattern, self.text)))