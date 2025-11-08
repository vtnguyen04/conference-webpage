import smtplib, ssl
from email.message import EmailMessage

msg = EmailMessage()
msg["Subject"] = "SMTP test"
msg["From"] = "nguyenvothanh04@gmail.com"
msg["To"] = "thcs2nguyen@gmail.com"
msg.set_content("Hello from Gmail SMTP via App Password.")

with smtplib.SMTP("smtp.gmail.com", 587) as s:
    s.starttls(context=ssl.create_default_context())
    s.login("nguyenvothanh04@gmail.com", "zifdvnxtksnyuzkw")
    s.send_message(msg)
