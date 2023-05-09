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

    // user_github = `<div class="github-card" data-github=${member.name} data-width="400" data-height="150" data-theme="default"></div>`
    // document.getElementById('user-github-handles').insertAdjacentHTML('beforeend', user_github)

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

let firepad

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
    firepad = Firepad.fromCodeMirror(firepadRef, codeMirror,
        { defaultText: 'Hello, World!' });

}

let displayGithubIssues = async () => {
        // check if room is present or not
    let response_room = await fetch(`/check_room/?room_name=${CHANNEL}`)
    let room = await response_room.json()
    let code_token = room.room
    // console.log("TOKEN PRESENT OR NOT: ", code_token)
    if(code_token === "NONE")
    {
        

        // const formContainer = document.getElementById("github-issues");
        const form1 = document.getElementById("github-issue-form");
        const form2 = document.getElementById("after-github-info");

        form1.addEventListener("submit", (e) => {
            event.preventDefault(); // prevent default form submission behavior
            // const name = document.getElementById("name").value;
            // const email = document.getElementById("email").value;
            let owner_name = e.target.owner_username.value
            let repo_name = e.target.repository_name.value 
            let access_token = e.target.authorization_code.value

            // store data somewhere, such as in an array or in local storage
            sessionStorage.setItem("owner_name", owner_name);
            sessionStorage.setItem("repo_name", repo_name);
            sessionStorage.setItem("access_token", access_token);
            // sessionStorage.setItem("repo_name", repo_name);
            
            // hide form 1 and show form 2
            form1.style.display = "none";
            form2.style.display = "block";
        });


        const formButton = document.getElementById('create-issue-btn');
        const formContainer = document.getElementById('create-issue-form');

        formButton.addEventListener('click', () => {
        formButton.style.display = 'none';
        formContainer.style.display = 'block';
        });

        formContainer.addEventListener('submit', (e) => {
        e.preventDefault();
        formContainer.style.display = 'none';
        formButton.style.display = 'block';
        });

    }
}

joinAndDisplayLocalStream()
// displayGithubIssues()
codeEditorFunction()
// InitEditor()

// window.addEventListener('code',InitEditor)

window.addEventListener('beforeunload', deleteMember)

document.getElementById('leave-btn').addEventListener('click', leaveAndRemoveLocalStream)
document.getElementById('camera-btn').addEventListener('click', toggleCamera)
document.getElementById('mic-btn').addEventListener('click', toggleMic)

///////////////    ASSIGN  GITHUB ISSUES    ////////////////////

let display_data = (data) => {
    for (let i in data) {

        // Get the ul with id of of issuesRepo
        let ul = document.getElementById('repo_issues');

        // Create variable that will create li's to be added to ul
        let li = document.createElement('li');
        
        // Add Bootstrap list item class to each li
        // li.classList.add('list-group-item')
    
        // Create the html markup for each li
        li.innerHTML = (`
            <p><strong>Title:</strong> ${data[i].title}</p>
            <p><strong>User:</strong> ${data[i].user.login}</p>
            <p><strong>URL:</strong> <a href="${data[i].html_url}">${data[i].html_url}</a></p>
        `);
        
        // Append each li to the ul
        ul.appendChild(li);
}}

let get_issue_func = async () => {

    const OWNER = sessionStorage.getItem('owner_name')
    const REPO = sessionStorage.getItem('repo_name')
    const ACCESS_CODE = sessionStorage.getItem('access_token')

    // let response = await fetch(`https://api.github.com/repos/${OWNER}/${REPO}/issues`,
    //     {
    //         headers: {
    //             'Accept': 'application/vnd.github+json',
    //             'Authorization': `${ACCESS_CODE}`,
    //             'X-GitHub-Api-Version': '2022-11-28'
    //         }
    //     })

    // let data = await response.json()
    // console.log("dataaa ", data)
    // display_data(data)

        // .then(response => response.json())
        // .then(data => {
        //     console.log(data)
        //     display_data(data);
        // })
        // .catch(error => console.error(error))



    let response = await fetch('/get_issue/', {
        method:'POST',
        headers: {
            'Content-Type':'application/json'
        },
        body:JSON.stringify({
            'owner': OWNER,
            'repo': REPO, 
            'code': ACCESS_CODE,
        })
    })
    let data = await response.json()
    // console.log("data issues: ", data.reply)
    display_data(data.reply)
} 


const form1 = document.getElementById("github-issue-form");
const form2 = document.getElementById("after-github-info");
document.getElementById("github-issue-form").addEventListener("submit", (e) => {
    e.preventDefault(); // prevent default form submission behavior
    // const name = document.getElementById("name").value;
    // const email = document.getElementById("email").value;
    let owner_name = e.target.owner_username.value
    let repo_name = e.target.repository_name.value 
    let access_token = e.target.authorization_code.value

    // store data somewhere, such as in an array or in local storage
    sessionStorage.setItem("owner_name", owner_name);
    sessionStorage.setItem("repo_name", repo_name);
    sessionStorage.setItem("access_token", access_token);
    // sessionStorage.setItem("repo_name", repo_name);

    get_issue_func()
    
    // hide form 1 and show form 2
    form1.style.display = "none";
    form2.style.display = "block";
});

const formButton = document.getElementById('create-issue-btn');
const formContainer = document.getElementById('issue-assign');

formButton.addEventListener('click', () => {
formButton.style.display = 'none';
formContainer.style.display = 'block';
});

let assign_issue_func = async (title, body, assignees, labels) => {

    let OWNER = sessionStorage.getItem('owner_name')
    let REPO = sessionStorage.getItem('repo_name')
    let ACCESS_CODE = sessionStorage.getItem('access_token')
    console.log("assignees: ", assignees, " labels: ", labels, " title: ", title, " body: ", body)
    let response = await fetch('/assign_issue/', {
        method:'POST',
        headers: {
            'Content-Type':'application/json'
        },
        body:JSON.stringify({
            'owner': OWNER,
            'repo': REPO, 
            'code': ACCESS_CODE,
            'title':title,
            'body':body, 
            'assignees':assignees, 
            'labels':labels,
        })
    })
} 


formContainer.addEventListener('submit', (e) => {
    e.preventDefault();

    // create an issue when submit button clicked 
    let title = e.target.issue_title.value  
    let body = e.target.issue_body.value 
    let assignees = e.target.issue_assignees.value
    let labels = e.target.issue_labels.value

    assign_issue_func(title, body, assignees, labels)

    formContainer.style.display = 'none';
    formButton.style.display = 'block';
});

// !function(d,s,id){
//     var js,fjs=d.getElementsByTagName(s)[0];
//     if(!d.getElementById(id)){
//       js=d.createElement(s);
//       js.id=id;
//       js.src="https://lab.lepture.com/github-cards/widget.js";
//       fjs.parentNode.insertBefore(js,fjs);
//     }
//   }(document,"script","github-cards-widget");

//////////////////// COMPILE CODE AND SHOW OUTPUT //////////////////////

let get_stdout = async (stdin, code) => {
    
    let response = await fetch('/compile_code/', {
        method:'POST',
        headers: {
            'Content-Type':'application/json'
        },
        body:JSON.stringify({
            'code': code,
            'stdin': stdin, 
        })
    })
    let data = await response.json()
    return data.stdout

}

const compileForm = document.getElementById('stdin');
compileForm.addEventListener('submit', async (e) => {

    e.preventDefault();
    // var codeMirror = CodeMirror.fromTextArea(document.getElementById('firepad'), { 
        
    //     lineNumbers: true,
    //     mode: "javasript"});

    var code = firepad.getText()

    console.log("code text:", code)

    

    // create an issue when submit button clicked 
    let stdin = e.target.stdin_in.value  

    // let stdout = await get_stdout(stdin, code)

    let response = await fetch('/compile_code/', {
        method:'POST',
        headers: {
            'Content-Type':'application/json'
        },
        body:JSON.stringify({
            'code': code,
            'stdin': stdin, 
        })
    })
    let data = await response.json()
    let stdout = data.stdout

    console.log("output: ", stdout)
    var textarea = document.getElementById("stdout");
    textarea.value = stdout;

});

// !function(d,s,id){
//     var js,fjs=d.getElementsByTagName(s)[0];
//     if(!d.getElementById(id)){
//       js=d.createElement(s);
//       js.id=id;
//       js.src="https://lab.lepture.com/github-cards/widget.js";
//       fjs.parentNode.insertBefore(js,fjs);
//     }
//   }(document,"script","github-cards-widget");