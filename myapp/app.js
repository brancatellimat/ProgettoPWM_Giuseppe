const express = require('express');
const SpotifyWebApi = require('spotify-web-api-node');
const path = require('path');
const app = express();
const port = 3000;
const bodyParser = require('body-parser');

// App permissions
const scopes = ['ugc-image-upload', 'user-read-email', 'user-read-private','playlist-read-collaborative','playlist-modify-public','playlist-read-private','playlist-modify-private','user-library-modify','user-library-read','user-top-read', 'user-read-playback-position','user-read-recently-played','user-follow-read','user-follow-modify'];

// App credentials
const client_id = '5a1af06bc9f040e197b5d8ec7b323250';
const secret = 'a3124554373e44809395acb941d6aa29';
const uri = 'http://127.0.0.1:3000/callback';

app.use(bodyParser.urlencoded({ extended: false }));

var user = {}; //Object for user data
var library = {}; //Object for user items (e.g. playlist, artist, album..)

app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');
app.use(express.static(__dirname + '/public'));

// Set app credentials for logged users
var spotifyApi = new SpotifyWebApi({
  clientId: client_id,
  clientSecret: secret,
  redirectUri: uri,
});

// TODO: set app credentials for not-logged users
var spotifyApiNotLogged = new SpotifyWebApi({
	clientId: client_id,
	clientSecret: secret,
});

// Retrive an access token
spotifyApiNotLogged.clientCredentialsGrant().then(
	function(data){
		// Save the access token so that it's used in future calls
		console.log(data.body.access_token);
		spotifyApiNotLogged.setAccessToken(data.body.access_token);
	}, function(err) {
		console.log('Something went wrong when retriving the access token', err);
	}
)

app.get('/', (req, res) => {
  
  res.render('index', {user: user, items: library});

})

app.get('/login', (req, res) => {
	//console.log(spotifyApi.createAuthorizeURL(scopes));
	res.end(spotifyApi.createAuthorizeURL(scopes));
})

app.get('/logout', (req, res) => {
	user = {};
	library = {};
	res.redirect('/');
})

app.get('/callback', (req, res) => {
	const error = req. query.error;
	  const code = req.query.code;
	  const state = req.query.state;
  
	  if(error){
		  console.error('Errore nella chiamata di callback: ', error);
		  res.render('error', {message: 'Errore nella chiamata di callback', error: error});
		  return;
	  }
  
	  spotifyApi.authorizationCodeGrant(code)
	  .then(data => {
		  let access_t = data.body.access_token;
		  let refresh_t = data.body.refresh_token;
		  let expires_in = data.body.expires_in;
  
		  spotifyApi.setAccessToken(access_t);
		  spotifyApi.setRefreshToken(refresh_t);
		  res.redirect('/homepage');
		  //Refresh access token
		  setInterval(async () => {
			  let data = await spotifyApi.refreshAccessToken();
			  let access_token = data.body.access_token;
		  }, expires_in / 2 * 1000);
	  })
	  .catch(err => {
		  console.error('Errore nell\'ottenere i token: ', err);
		  res.render('error', {message: 'Errore nell\'ottenere i token', error: err});
	  });
  })

app.get('/homepage', (req, res) => {
  spotifyApi.getMe().then(data => {

	user.userData = data.body;
	//console.log(user.userData);
	return spotifyApi.getUserPlaylists(user.userData.name).then(data => {
		return data.body;
	}).catch(err => {
		res.render('error', {message: 'Errore nel recuperare le tue playlists.', error: err});
	});

    //res.render('index', {user: user});
  }).then(playlists => {
	library.playlistList = playlists;
	res.render('index', {user: user, items: library});
  }).catch(err => {
	console.log(JSON.stringify(err));
	res.render('error', {message: 'Errore nel recuperare i dati del tuo profilo.', error: err});
  });
});

app.get('/discover', (req, res) => {
	res.render('discover', {user: user});
})

app.get('/search/:txt/:type', (req, res) => {
	const txt = req.params.txt;
	const type = req.params.type;
	spotifyApiNotLogged.search(txt, [type]).then(results => {
		res.send(results.body);
		//console.log(results);
	})

})

app.get('/more/:idPlaylist', (req, res) => {
	const idPlaylist = req.params.idPlaylist;
	spotifyApiNotLogged.getPlaylist(idPlaylist).then(results => {
		if(user.userData === undefined){
			res.render('playlist', {user: user, playlist: results.body, status: 'no-login'});
		}else {
			isInMyLibrary(idPlaylist, 'playlist').then(result => {
				if(result){
					res.render('playlist', {user: user, playlist: results.body, status: 'present'});
				}else {
					res.render('playlist', {user: user, playlist: results.body, status: 'absent'});
				}
			})
		}
	}).catch(err => {
		res.render('error', {message: 'Errore nel cercare le playlist', error: err});
	});
	
})

function isInMyLibrary(id, type){
	if(type == 'playlist'){
		return spotifyApi.getUserPlaylists().then(data => {
			//console.log(data.body);
			for(i=0; i<data.body.total; i++){
				if(id === data.body.items[i].id)
					return true;
			}
			return false;
		});
	}
}

app.get('/create', (req, res) => {
	res.render('create', {user:user});
})


app.get('/createPlaylist/:data', (req, res)=>{

	var playlistData = JSON.parse(req.params.data);
	var id = '', playlistTracks = [];
	//console.log(playlistData);
	spotifyApi.createPlaylist(playlistData.title, {'description':playlistData.description, 'public':playlistData.isPublic}).then(data => {
		console.log(playlistData.artists);

		return id = data.body.id;
	}).then(id => {
		console.log(playlistData.numElem);
		return spotifyApi.getRecommendations({'limit': playlistData.numElem, 'seed_artists': playlistData.artists}).then(data => {
			let tracks = data.body.tracks;
			tracks.forEach(track => {
				playlistTracks.push(track.uri);
			}); 
			return playlistTracks;
		}).catch(err => {
			console.log('Errore nel recuperare il contenuto ' + err);
		});
	}).then(array => {
		return spotifyApi.addTracksToPlaylist(id, array).then(data => {
			console.log('SONO QUI !!!!!!!!!!!!!!!!!!!!!!!!!!!!!');
			return data;
		}).catch(err => {
			console.log('errore nell\'aggiungere le tracce alla playlist');
		});
	}).then((data)=>{
		if(data.statusCode === 201){
			res.send(data);
		}
	}).catch(err => {
		console.log('Errore nel creare la playlist ' + err);
	});
});

app.get('/savePlaylist/:id', (req, res) => {
	const idPlaylist = req.params.id;
	spotifyApi.followPlaylist(idPlaylist).then(data => {
		res.send(data);
	}).catch(err => {
		res.render('error', {message:'Non sono riuscito ad aggiungere la playlist ai tuoi preferiti', error: err});
	})
})

app.get('/removePlaylist/:id', (req, res) => {
	const idPlaylist = req.params.id;
	spotifyApi.unfollowPlaylist(idPlaylist).then(data => {
		res.send(data);
	}).catch(err => {
		res.render('error', {message:'Non sono riuscito a rimuovere la playlist dai tuoi preferiti', error: err});
	})
})

var server = app.listen(port, () => {

  console.log('Applicazione in ascolto sulla port %s\n', port);

})