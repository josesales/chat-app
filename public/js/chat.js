const socket = io();

//Elements
const messagesDiv = document.getElementById('messages');
const messageForm = document.getElementById('message-form');
const messageInput = messageForm.querySelector('input');
const messageButton = messageForm.querySelector('button');
const sendLocationButton = document.getElementById('send-location');
const sidebarRoom = document.getElementById('sidebar-room');

//Templates
const messageTemplate = document.getElementById('message-template');
const locationTemplate = document.getElementById('location-template');
const sidebarTemplate = document.getElementById('sidebar-template');

//Options
const { username, room } = Qs.parse(location.search, { ignoreQueryPrefix: true });

//Check if it should auto scroll when a new message is received  
const autoScroll = () => {
    //New message element
    const newMessageClass = messagesDiv.lastElementChild;

    //Get the height of the new message
    const newMessageStyles = getComputedStyle(newMessageClass);
    const newMessageMargin = parseInt(newMessageStyles.marginBottom);
    console.log(newMessageMargin);
    const newMessageHight = newMessageClass.offsetHeight + newMessageMargin;

    //Get visible height
    const visibleHeight = messagesDiv.offsetHeight;

    //Height of messages container
    const containerHeight = messagesDiv.scrollHeight;

    //How far down it is scrolled
    const scrollOffSet = messagesDiv.scrollTop + visibleHeight;

    if(containerHeight - newMessageHight <= scrollOffSet) {
        messagesDiv.scrollTop = containerHeight;
    }
}

socket.on('message', message => {

    const html = Mustache.render(messageTemplate.innerHTML, {
        text: message.text,
        username: message.username,
        createdAt: moment(message.createdAt).format('hh:mm a'),
    });

    messagesDiv.insertAdjacentHTML('beforeend', html);
    autoScroll();
});

socket.on('locationMessage', locationMessage => {

    const html = Mustache.render(locationTemplate.innerHTML, {
        url: locationMessage.url,
        username: locationMessage.username,
        createdAt: moment(locationMessage.createdAt).format('hh:mm a'),
    });

    messagesDiv.insertAdjacentHTML('beforeend', html);
    autoScroll();
});


messageForm.addEventListener('submit', (event) => {
    event.preventDefault();

    messageButton.setAttribute('disabled', 'disabled');
    const message = event.target.elements.message.value; //get the input element by its name

    socket.emit('sendMessage', message, (error) => {

        messageButton.removeAttribute('disabled');
        messageInput.value = '';
        messageInput.focus();

        if (error) {
            console.log(error);
            return;
        }
        console.log(`Message delivered in ${room} room by ${username}`);
    });
});

sendLocationButton.addEventListener('click', (event) => {

    if (!navigator.geolocation) {
        return alert('Geolocation is not supported by your browser. Please consider to get a more updated browser');
    }

    sendLocationButton.setAttribute('disabled', 'disabled');

    navigator.geolocation.getCurrentPosition((position) => {

        socket.emit('sendLocation', {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
        }, () => {

            sendLocationButton.removeAttribute('disabled');
            console.log('Location sent');
        });
    })
});

socket.emit('join', { username, room }, error => {
    if (error) {
        alert(error);
        location.href = './index.html'
    }
});

//Notify when users join and leave the room
socket.on('roomData', ({ room, users }) => {
    const html = Mustache.render(sidebarTemplate.innerHTML, {
        room,
        users
    });

    sidebarRoom.innerHTML = html;
});