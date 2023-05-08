const APP_ID = 'c8543d5fb1f14fe8ae27169d84a3abb7'
const CHANNEL = sessionStorage.getItem('room')
// const CHANNEL = 'bfc4789562c3403faa232bae3cefcc80'
const TOKEN = sessionStorage.getItem('token')
let UID = Number(sessionStorage.getItem('UID'));

let NAME = sessionStorage.getItem('name')
let editor

const client = AgoraRTC.createClient({mode:'rtc', codec:'vp8'})

let localTracks = []
let remoteUsers = {}

let joinAndDisplayLocalStream = async () => {
    document.getElementById('room-name').innerText = CHANNEL


    client.on('user-published', handleUserJoined)
    client.on('user-left', handleUserLeft)

    try{
        UID = await client.join(APP_ID, CHANNEL, TOKEN, UID)
    }catch(error){
        console.error(error)
        window.open('/', '_self')
    }
    
    localTracks = await AgoraRTC.createMicrophoneAndCameraTracks()

    let member = await createMember()



    let player = `<div  class="video-container" id="user-container-${UID}">
                     <div class="video-player" id="user-${UID}"></div>
                     <div class="username-wrapper"><span class="user-name">${member.name}</span></div>
                  </div>`
    
    document.getElementById('video-streams').insertAdjacentHTML('beforeend', player)

   
    localTracks[1].play(`user-${UID}`)

    // var container = document.createElement('div');
    // container.setAttribute('class', 'github-card');
    // container.setAttribute('data-github', member.name);
    // container.setAttribute('data-width', '400');
    // container.setAttribute('data-height', '200');
  
    // // Add the container div to the HTML document
    // document.body.appendChild(container);

    user_github = `<div class="github-card" data-github=${member.name} data-width="400" data-height="150" data-theme="default"></div>`
    document.getElementById('user-github-handles').insertAdjacentHTML('beforeend', user_github)

    // let response_check = await fetch(`/set_room_name/?room_name=${CHANNEL}`)
    // users_check = await response_check.json()
    await client.publish([localTracks[0], localTracks[1]])
}

let handleUserJoined = async (user, mediaType) => {
    remoteUsers[user.uid] = user
    await client.subscribe(user, mediaType)

    if (mediaType === 'video'){
        let player = document.getElementById(`user-container-${user.uid}`)
        if (player != null){
            player.remove()
        }

        let member = await getMember(user)

        player = `<div  class="video-container" id="user-container-${user.uid}">
            <div class="video-player" id="user-${user.uid}"></div>
            <div class="username-wrapper"><span class="user-name">${member.name}</span></div>
        </div>`

        document.getElementById('video-streams').insertAdjacentHTML('beforeend', player)

        user.videoTrack.play(`user-${user.uid}`)

        user_github = `<div class="github-card" data-github=${member.name} data-width="400" data-height="150" data-theme="default"></div>`
        document.getElementById('user-github-handles').insertAdjacentHTML('beforeend', user_github)
    }

    if (mediaType === 'audio'){
        user.audioTrack.play()
    }
}

let handleUserLeft = async (user) => {
    delete remoteUsers[user.uid]
    document.getElementById(`user-container-${user.uid}`).remove()
}

let leaveAndRemoveLocalStream = async () => {
    for (let i=0; localTracks.length > i; i++){
        localTracks[i].stop()
        localTracks[i].close()
    }

    await client.leave()
    //This is somewhat of an issue because if user leaves without actaull pressing leave button, it will not trigger
    deleteMember()
    window.open('/', '_self')
}

let toggleCamera = async (e) => {
    console.log('TOGGLE CAMERA TRIGGERED')
    if(localTracks[1].muted){
        await localTracks[1].setMuted(false)
        e.target.style.backgroundColor = '#fff'
    }else{
        await localTracks[1].setMuted(true)
        e.target.style.backgroundColor = 'rgb(255, 80, 80, 1)'
    }
}

let toggleMic = async (e) => {
    console.log('TOGGLE MIC TRIGGERED')
    if(localTracks[0].muted){
        await localTracks[0].setMuted(false)
        e.target.style.backgroundColor = '#fff'
    }else{
        await localTracks[0].setMuted(true)
        e.target.style.backgroundColor = 'rgb(255, 80, 80, 1)'
    }
}

let createMember = async () => {
    let response = await fetch('/create_member/', {
        method:'POST',
        headers: {
            'Content-Type':'application/json'
        },
        body:JSON.stringify({'name':NAME, 'room_name':CHANNEL, 'UID':UID})
    })
    let member = await response.json()
    return member
}


let getMember = async (user) => {
    let response = await fetch(`/get_member/?UID=${user.uid}&room_name=${CHANNEL}`)
    let member = await response.json()
    return member
}

let deleteMember = async () => {
    let response = await fetch('/delete_member/', {
        method:'POST',
        headers: {
            'Content-Type':'application/json'
        },
        body:JSON.stringify({'name':NAME, 'room_name':CHANNEL, 'UID':UID})
    })
    let member = await response.json()
}


////////// CODE EDITOR CODE /////////////////

let codeEditorFunction = async () => {

    // Initialize the Firebase SDK.
    firebase.initializeApp({
      apiKey: 'AIzaSyDtz7Sro_WRcXsd1JNByOVz-gbDJkPCsak',
      databaseURL: 'https://collabhub-ab2b3-default-rtdb.firebaseio.com'
    });

    // Get Firebase Database reference.
    var firepadRef = firebase.database().ref();

    // check if room is present or not
    let response_room = await fetch(`/check_room/?room_name=${CHANNEL}`)
    let room = await response_room.json()
    let code_token = room.room
    // console.log("TOKEN PRESENT OR NOT: ", code_token)
    if(code_token !== "NONE")
    {
        window.history.replaceState(null, "Collab Hub", "?id="+code_token)
    }

    const urlpatterns = new URLSearchParams(window.location.search)
    const roomId = urlpatterns.get("id")

    if(roomId) {
      firepadRef = firepadRef.child(roomId)
    } else {
        // GOING TO ELSE IF ROOM IS NOT PRESENT
        // console.log("key before: ", firepadRef.key)
        firepadRef = firepadRef.push()
        // console.log("key after: ", firepadRef.key)
        let response = await fetch(`/join_code_room/?room_name=${CHANNEL}&token_gen=${firepadRef.key}`)
        let code_token = await response.json()
        // firepadRef = firepadRef.child(code_token.code)


    //   firepadRef = firepadRef.push()
      window.history.replaceState(null, "Collab Hub", "?id="+code_token.code)
    }
    // Create CodeMirror (with lineWrapping on).
    var codeMirror = CodeMirror(document.getElementById('firepad'), { 
    lineWrapping: true , 
    lineNumbers: true,
    theme: 'dracula',
    mode: 'javascript'});
    codeMirror.setSize("100%", "100%")
    // Create Firepad (with rich text toolbar and shortcuts enabled).
    var firepad = Firepad.fromCodeMirror(firepadRef, codeMirror,
        { defaultText: 'Hello, World!' });

}



joinAndDisplayLocalStream()
codeEditorFunction()
// InitEditor()

// window.addEventListener('code',InitEditor)

window.addEventListener('beforeunload', deleteMember)

document.getElementById('leave-btn').addEventListener('click', leaveAndRemoveLocalStream)
document.getElementById('camera-btn').addEventListener('click', toggleCamera)
document.getElementById('mic-btn').addEventListener('click', toggleMic)

!function(d,s,id){
    var js,fjs=d.getElementsByTagName(s)[0];
    if(!d.getElementById(id)){
      js=d.createElement(s);
      js.id=id;
      js.src="https://lab.lepture.com/github-cards/widget.js";
      fjs.parentNode.insertBefore(js,fjs);
    }
  }(document,"script","github-cards-widget");