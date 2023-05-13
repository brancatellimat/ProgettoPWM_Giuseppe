
//Save playlist in user library
async function savePlaylist(id){
    await fetch('/savePlaylist/'+id).then(response => {
        return response.json();
    }).then(data => {
        console.log(data.body);
        let icon = document.getElementById('addIcon');
        let text = document.getElementById('addText');
        let btn = document.getElementById('addButton');
        icon.classList.remove('bx-heart');
        icon.classList.add('bxs-trash');

        text.innerText = 'Rimuovi';

        btn.setAttribute('onclick', 'removePlaylist()');
        

    });
}

async function removePlaylist(id){
  await fetch('/removePlaylist/'+id).then(response => {
      return response.json();
  }).then(data => {
      console.log(data);
      let icon = document.getElementById('addIcon');
      let text = document.getElementById('addText');
      let btn = document.getElementById('addButton');
      icon.classList.remove('bxs-trash');
      icon.classList.add('bx-heart');

      text.innerText = 'Salva!';
      btn.setAttribute('onclick', 'savePlaylist()');

  });
}

function accedi(){
   let xhttp = new XMLHttpRequest();
    xhttp.onreadystatechange = () => {
        //console.log(xhttp);
        if(xhttp.readyState == 4 && xhttp.status == 200)
            window.location.href = xhttp.responseText;
    }

    xhttp.open('GET', '/login', true);
    xhttp.setRequestHeader('Access-Control-Allow-Origin', '*');
    xhttp.send();
  }

async function logout(){
    await fetch('/logout').then(response => {
      return response.text();
    }).then(data => {
      console.log(data);
      window.location.href = '/';
    });
  }

  async function sendSearch(txt){
    await fetch('/search/' + txt + "/playlist").then(data=>{
        return data.json();
    }).then(results=>{
        clearResultsArea();
        results.playlists.items.forEach(playlist => {
            createElement(playlist);
        });
    });
  }

  function createElement(playlist){
    const resultsArea = document.getElementById('results');
    const cols = document.createElement('div');
    const card = document.createElement('div');
    const cover = document.createElement('img');
    const cardBody = document.createElement('div');
    const title = document.createElement('h5');
    const description = document.createElement('p');
    const btn = document.createElement('a');

    cols.setAttribute('class', 'col-sm-12 col-lg-4 col-md-6 my-3');
    card.setAttribute('class', 'card h-100 mx-auto hs');
    card.setAttribute('style', 'max-width: 16rem;');
    cover.setAttribute('src', playlist.images[0].url);
    cover.setAttribute('alt', 'Playlist cover');
    cover.setAttribute('class', 'card-img-top px-3 py-3');
    cardBody.setAttribute('class', 'card-body pt-0');
    title.setAttribute('class', 'card-text fw-500');
    description.setAttribute('class', 'text-truncate fw-300');
    btn.setAttribute('href', '/more/'+playlist.id);
    btn.setAttribute('class', 'btn btn-primary');

    title.innerText = playlist.name;
    description.innerHTML = playlist.description;
    btn.innerText = 'More';

    cardBody.appendChild(title);
    cardBody.appendChild(description);
    cardBody.appendChild(btn);
    card.appendChild(cover);
    card.appendChild(cardBody);
    cols.appendChild(card);
    resultsArea.appendChild(cols);
  }

  function clearResultsArea(){
    const resultsArea = document.getElementById('results');
    resultsArea.innerHTML = '';
  }

  function createModal(){
    const myModal = new bootstrap.Modal(document.getElementById('myModal'), {});
    document.getElementById('msgBody').innerText = 'La playlist è stata creata correttamente. La puoi trovare nella tua libreria!';

    myModal.show();
  }