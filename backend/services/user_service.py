# def get_user_by_email(email: str):
#     # Temporary mock user for testing
#     if email == "test@gmail.com":
#         return {
#             "_id": "12345",
#             "email": "test@gmail.com",
#             "password": "1234"  # plain for testing only
#         }
#     return None
from hashing import hash_password
from database import db

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