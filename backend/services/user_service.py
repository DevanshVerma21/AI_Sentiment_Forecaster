# def get_user_by_email(email: str):
#     # Temporary mock user for testing
#     if email == "test@gmail.com":
#         return {
#             "_id": "12345",
#             "email": "test@gmail.com",
#             "password": "1234"  # plain for testing only
#         }
#     return None
from pymongo import MongoClient
from hashing import hash_password

# MongoDB Atlas connection
try:
    client = MongoClient(
        "mongodb+srv://DevanshVerma:qazxsw123@cluster0.fxr8rpr.mongodb.net/ai_project_db?retryWrites=true&w=majority&appName=Cluster0",
        serverSelectionTimeoutMS=5000
    )
    client.server_info()
    print("MongoDB Connected Successfully")
except Exception as e:
    print("MongoDB Connection Failed:", e)
    
db = client["ai_project_db"]
users_collection = db["users"]


def get_user_by_email(email: str):
    return users_collection.find_one({"email": email})

def create_user(firstname: str, lastname: str, email: str, password: str):
    hashed_pw = hash_password(password)

    new_user = {
        "firstname": firstname,
        "lastname": lastname,
        "email": email,
        "password": hashed_pw
    }

    result = users_collection.insert_one(new_user)
    return str(result.inserted_id)