from django.shortcuts import render
from django.http import JsonResponse
from agora_token_builder import RtcTokenBuilder
from django.core.exceptions import ObjectDoesNotExist
import random
import time
import json
import requests

from .models import RoomMember, Room_Code

from django.views.decorators.csrf import csrf_exempt
# Create your views here.


remote_users = []

def set_room_name(request):
    room_name = request.GET.get('room_name')
    global remote_users 
    remote_users = RoomMember.objects.filter(room_name=room_name,)

    return JsonResponse({'room':room_name}, safe=False)


def getToken(request):
    appId = 'c8543d5fb1f14fe8ae27169d84a3abb7'
    appCertificate = 'bfc4789562c3403faa232bae3cefcc80'
    channelName = request.GET.get('channel')
    uid = random.randint(1,230)
    expirationTimeInSeconds = 3600 * 24 # expire in 24 hours 
    currentTimeStamp = time.time()
    privilegeExpiredTs = currentTimeStamp + expirationTimeInSeconds
    role = 1

    token = RtcTokenBuilder.buildTokenWithUid(appId, appCertificate, channelName, uid, role, privilegeExpiredTs)
    return JsonResponse({'token': token, 'uid': uid} ,safe = False)

def main_page(request):
    return render(request, 'base/landing.html')

def lobby(request):
    return render(request, 'base/lobby.html')

def room(request):
    # room_name = request.GET.get('room_name')

    # members = RoomMember.objects.get(
    #     room_name=room_name,
    # )

    # context = {
    #     'github_handles': remote_users
    # }
    return render(request, 'base/room.html')

# def joinCodeRoom(request):
#     room_name = request.GET.get('room_name')
#     new_code = request.GET.get('token_gen')

#     try:
#         codeRoom = Room_Code.objects.get(room_name = room_name)
#         code = codeRoom.code_token
#     except ObjectDoesNotExist:
#         code = new_code 
#         Room_Code.objects.create(room_name = room_name, code_token = code)

#     return JsonResponse({'code':code}, safe=False)


def joinCodeRoom(request):
    room_name = request.GET.get('room_name')
    new_code = request.GET.get('token_gen')

    # try:
    #     codeRoom = Room_Code.objects.get(room_name = room_name)
    #     code = codeRoom.code_token
    # except ObjectDoesNotExist:
    #     code = new_code 
    Room_Code.objects.create(room_name = room_name, code_token = new_code)

    return JsonResponse({'code':new_code}, safe=False)



def checkRoom(request):
    room_name = request.GET.get('room_name')

    try:
        codeRoom = Room_Code.objects.get(room_name = room_name)
        code = codeRoom.code_token
    except ObjectDoesNotExist:
        code = "NONE"
    return JsonResponse({'room':code}, safe=False)




@csrf_exempt
def createMember(request):
    data = json.loads(request.body)
    member, created = RoomMember.objects.get_or_create(
        name=data['name'],
        uid=data['UID'],
        room_name=data['room_name']
    )

    return JsonResponse({'name':data['name']}, safe=False)


def getMember(request):
    uid = request.GET.get('UID')
    room_name = request.GET.get('room_name')

    member = RoomMember.objects.get(
        uid=uid,
        room_name=room_name,
    )
    name = member.name
    return JsonResponse({'name':member.name}, safe=False)

@csrf_exempt
def deleteMember(request):
    data = json.loads(request.body)
    member = RoomMember.objects.get(
        name=data['name'],
        uid=data['UID'],
        room_name=data['room_name']
    )
    member.delete()
    return JsonResponse('Member deleted', safe=False)

# def getMember(request):
#     room_name = request.GET.get('room_name')

#     member = RoomMember.objects.get(
#         room_name=room_name,
#     )

# ASSIGN ISSUE
@csrf_exempt
def assign_issue(request):
    data = json.loads(request.body)
    owner = data['owner']
    repo = data['repo']
    access_code = data['code']
    title = data['title']
    body = data['body']
    assignees = data['assignees']
    labels = data['labels']

    print("ASSIGNEES: ", assignees)
    

    # owner = 'lavish2210'
    # repo = 'ColabHub'


    response = requests.post(
        f'https://api.github.com/repos/{owner}/{repo}/issues',
        headers={
            'Accept': 'application/vnd.github+json',
            'Authorization': access_code,
            'X-GitHub-Api-Version': '2022-11-28'
        },
        json={
            'title': title,
            'body': body,
            'assignees': assignees.split(","),
            'labels': labels.split(","),
        }
    )
    return JsonResponse('Issue Assigned', safe=False)

@csrf_exempt
def get_issue(request):

    # owner = request.GET.get('owner')
    # repo = request.GET.get('repo')
    # access_code = request.GET.get('code')
    data = json.loads(request.body)
    owner = data['owner']
    repo = data['repo']
    access_code = data['code']

    response = requests.get(
        f'https://api.github.com/repos/{owner}/{repo}/issues',
        headers={
            'Accept': 'application/vnd.github+json',
            'Authorization': access_code,
            'X-GitHub-Api-Version': '2022-11-28'
        }
    )
    a = response.json() 
    # print(a)
    # for id in a:
    #     print(id)
    return JsonResponse({'reply': a}, safe=False)



@csrf_exempt
def compile_code(request):
    data = json.loads(request.body)
    code = data['code']
    stdin = data['stdin']
    lang_id = data['language_id']

    url = "https://judge0-ce.p.rapidapi.com/submissions"

    querystring = {"base64_encoded":"false","fields":"*"}

    payload = {
        "language_id": lang_id,
        "source_code": code,
        "stdin": stdin
    }
    headers = {
        "content-type": "application/json",
        "Content-Type": "application/json",
        "X-RapidAPI-Key": "436ad4801cmsh6a9cf63a1f1730ep18f30ejsn1af9f494dffa",
        "X-RapidAPI-Host": "judge0-ce.p.rapidapi.com"
    }

    response = requests.post(url, json=payload, headers=headers, params=querystring)

    print(response.json())

    token=response.json()["token"]

    url = f'https://judge0-ce.p.rapidapi.com/submissions/{token}'

    querystring = {"base64_encoded":"false","fields":"*"}

    headers = {
        "X-RapidAPI-Key": "436ad4801cmsh6a9cf63a1f1730ep18f30ejsn1af9f494dffa",
        "X-RapidAPI-Host": "judge0-ce.p.rapidapi.com"
    }

    response = requests.get(url, headers=headers, params=querystring)

    print(response.json())
    print(response.json()["stdout"])
    stdout = response.json()["stdout"]

    return JsonResponse({'stdout': stdout}, safe=False)


@csrf_exempt
def create_repo_user(request):

    data = json.loads(request.body)
    # owner = data['owner']
    # repo = data['repo']
    access_code = data['code']
    repo_name = data['title']
    repo_desc = data['body']
    private_bool = data['private']

    if(private_bool == "Yes"):
        private_bool = "true"
    else: 
        private_bool = "false"

    response = requests.post(
        f'https://api.github.com/user/repos',
        headers={
            'Accept': 'application/vnd.github+json',
            'Authorization': access_code,
            'X-GitHub-Api-Version': '2022-11-28'
        },
        json={"name": repo_name ,
              "description": repo_desc,
              "homepage":"https://github.com",
              "private": private_bool,
              "is_template":"true"}
    )
    return JsonResponse('Repo Created', safe=False)