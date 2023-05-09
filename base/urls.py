from django.urls import path 
from . import views 

urlpatterns = [
    path('', views.lobby),
    path('room/', views.room),
    path('get_token/', views.getToken),
    path('create_member/', views.createMember),
    path('get_member/', views.getMember),
    path('delete_member/', views.deleteMember),
    path('join_code_room/', views.joinCodeRoom),
    path('check_room/', views.checkRoom),
    path('set_room_name/', views.set_room_name),
    path('assign_issue/', views.assign_issue),
    path('get_issue/', views.get_issue),
]