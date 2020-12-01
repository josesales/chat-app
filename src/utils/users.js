const users = [];

exports.addUser = ({ id, username, room }) => {
    //Clean the data
    username = username.trim().toLowerCase();
    room = room.trim().toLowerCase();

    //Validate Data
    if (!username || !room) {
        return {
            error: 'Username and room are required!'
        }
    }

    //Check for existing users
    const existingUser = users.find(user => {
        return user.username == username && user.room == room
    });

    //Validate username
    if (existingUser) {
        return {
            error: 'Username is in use!'
        }
    }

    //Store user
    const user = { id, username, room };
    users.push(user);
    
    return { user };
}

exports.removeUser = id => {
    const index = users.findIndex(user => user.id === id);

    if (index !== -1) {
        return users.splice(index, 1)[0];
    }
}

exports.getUser = id => {
    const user = users.find(user => user.id === id);

    if (!user) {
        return {
            error: 'User not found!'
        }
    }

    return user;
}

exports.getUsersInRoom = room => {
    return users.filter(user => user.room === room);
}
