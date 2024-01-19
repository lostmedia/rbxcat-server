<h1 align="center">rbxcat-server</h1>

![rbxcat-server-2](https://github.com/lostmedia/rbxcat-server/assets/70608092/91a763e8-70ab-4d1e-8f98-a34110931785)

A webserver for [rbxcat](https://github.com/fartg/rbxcat)'s analytics and roblox-ocm services written in express!
  
<h1 align="center"> Introduction </h1>

When Hunter[(@oh)](https://github.com/oh) and I set out to create an analytics engine (with included webserver) for ROBLOX, we didn't code it for scalability. With the upcoming release of our own analytics service, we decided to take a step back and make a one-size-fits-most, open-sourced version of our webserver. Whether your project is 5 games, 1 game, or contracted work, you deserve the ability to communicate to and from game servers easily. With ROBLOX's [Open Cloud Messaging API system](https://create.roblox.com/docs/cloud/open-cloud/usage-messaging), this is made possible but difficult.

<h1 align="center"> Requirements </h1>
In order to run rbxcat-server, you need to have a few prereqs met.

1. Your own webserver (or localhost with the ability to receive requests!)

2. A [MongoDB instance](https://hub.docker.com/_/mongo) running on your webserver

3. The technical know how to run a [Node.JS instance](https://hub.docker.com/_/node/) on your server

<h1 align="center"> Installation </h1>

1. To install via git (if your webserver has this functionality), you can download the latest image via:
```bash
mkdir rbxcat-server
git clone https://github.com/lostmedia/rbxcat-server rbxcat-server
```
2. You can then edit your .env file (included) with the following parameters:
```bash
api_key="a_super_secret_key_that_you_pick"
mongodb_url="your_mongodb_ip"
mongodb_port="your_mongodb_port"
mongodb_user="your_mongodb_username"
mongodb_pass="your_mongodb_password"
```
4. Install the prequisites with:
```bash
npm install package.json
```

5. To serve the server, you can set your autorun in your node instance to:
```bash
node main.js
```
<h1 align="center"> Setup </h1>

Here you will apply for your Roblox Open Cloud Messaging API keys and register them into your MongoDB database so you can use short names instead of full api keys during requests.

<h2 align="center">Grabbing a RBX_OCM_APIKEY</h2>

1. Head to the [ROBLOX API key dashboard](https://create.roblox.com/dashboard/credentials?activeTab=ApiKeysTab)
2. Click "Create API Key" and give it a name and description.
3. Under "Access Permissions", select the "Messaging Service API" subsystem and click "Add API system".
4. Click "Select an experience" on the right side of the newly populated dropdown, and select the game you'd to have an API key for.
5. Click "Add Experience" and scroll down to the "Accepted IP Addresses" section.
6. Add the IP address of your webserver (or your localhost) and press "Add IP Address" (Add any other IP addresses that will communicate with ROBLOX here)
7. Press "Save & Generate Key" and copy-paste the generated key into a notepad for later use.

<h2 align="center">Registering your RBX_OCM_APIKEY short_name</h2>

You don't want to have to use this long, convoluted API key every time you want to post a request to a game server. It's not pretty to look at, and it sure isn't secure.
Here, we're going to add a short_name into our MongoDB "rbx_ocm_apikey" collection so that way whenever we want to communicate to a certain API key, we just use its short name
(After all, if a threat actor can access both your authorization header AND your short_name, you have bigger fish to fry)

1. Grab your favorite POST request client. (We'll be using Postman in this example)
2. Set up your URL, Headers and Body as the following:
![image](https://github.com/lostmedia/rbxcat-server/assets/70608092/bf288ca5-b5f7-49e8-97a3-6ee32a191888)
![image](https://github.com/lostmedia/rbxcat-server/assets/70608092/1600b176-23fc-4f85-a09f-ee855cb88e22)
3. Replace all of the information with the information you've been provided by ROBLOX
   (make sure to grab the Universe ID of the place the API key represents)
5. Click "Post" and if your receive a response of "success" you're all done!


<h1 align="center"> What can it do? </h1>
Well, for one, your rbxcat-server can:

- Receive multiple types of requests and share them with your MongoDB instance
- Send and receive from ROBLOX game servers via OpenCloudMessaging
- Link to your existing rbxcat-built game and send analytics automatically

Let's say you wanted to grab a player named "watchconnector" 's rbxcat information (if they were in your game) and you had your rbxcat-server instance hosted on https://api.your.link.
You would do so by doing the following:
```js
let request = await axios({
            url: "https://api.your.link/database/player/player_name",
            headers: {"authorization": "your_auth_key"},
            method: "get",
            data: {"rbx_ocm_apikey": "your_rbx_ocm_short_name"}
        });

console.log(JSON.stringify(request.data.response, null, 2));
```

Which would return:
```json
{
  "player": {
    "Inventory": {
      "money": 0
    },
    "Stats": {
      "playtime": 41
    },
    "Settings": {
      "volume_sfx": 2,
      "volume_music": 2,
      "in_menu": false
    },
    "name": "watchconnector",
    "player": {
      "time_played": 41,
      "vip": true,
      "join_time": 1705613258,
      "device_type": "Desktop"
    },
    "game": {
      "server_id": "server_id",
      "version": "v0.0.0",
      "name": "rbxcat"
    },
    "userid": 129180189,
    "displayname": "leah"
  }
}
```


<h1 align="center"> Integration </h1>

You can also link your rbxcat-server instance to your own [rbxcat-bot](https://github.com/fartg/rbxcat-bot) instance and do some really nice things like:


- Grabbing a player's server id and seending a message to that server:

https://github.com/lostmedia/rbxcat-server/assets/70608092/f05ca49e-08f2-45a2-80cd-d5ce0c2cc423


