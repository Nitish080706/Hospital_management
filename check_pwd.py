import sqlite3
import bcrypt

conn = sqlite3.connect('aitool/hospital.db')
cur = conn.cursor()
pwd = cur.execute('SELECT password FROM users WHERE user_id="nurse-001"').fetchone()[0]
print("DB HASH:", pwd)
print("IS MATCH:", bcrypt.checkpw(b'nurse123', pwd.encode()))
