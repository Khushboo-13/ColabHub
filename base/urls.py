from django.urls import path 
from . import views 

urlpatterns = [
    path('', views.main_page),
    path('lobby/', views.lobby),
    path('room/', views.room, name = 'room'),
    path('get_token/', views.getToken),
    path('create_member/', views.createMember),
    path('get_member/', views.getMember),
    path('delete_member/', views.deleteMember),
    path('join_code_room/', views.joinCodeRoom),
    path('check_room/', views.checkRoom),
    path('set_room_name/', views.set_room_name),
    path('assign_issue/', views.assign_issue),
    path('get_issue/', views.get_issue),
    path('compile_code/', views.compile_code),
    path('create_repo/', views.create_repo_user),
    path('github_issues/', views.github_issues, name = 'github'),
    path('personal_page/', views.personal_page, name = 'personal'),
    path('colaborate/', views.personal_page, name = 'personal'),
]