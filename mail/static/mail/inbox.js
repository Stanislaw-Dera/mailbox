document.addEventListener('DOMContentLoaded', function() {

  // Use buttons to toggle between views
  document.querySelector('#inbox').addEventListener('click', () => load_mailbox('inbox'));
  document.querySelector('#sent').addEventListener('click', () => load_mailbox('sent'));
  document.querySelector('#archived').addEventListener('click', () => load_mailbox('archive'));
  document.querySelector('#compose').addEventListener('click', compose_email);

  document.getElementById('compose-view').addEventListener('submit', (event) => {
    const recipients = document.querySelector('#compose-recipients').value;
    const subject = document.querySelector('#compose-subject').value;
    const body = document.querySelector('#compose-body').value;

    if (!recipients || !subject || !body) {
      alert('all fields must be filled out. ')
      event.preventDefault();
    } else{

      console.log(`rec: ${recipients}, sub: ${subject}, body: ${body}`);

      fetch('/emails', {
      method: 'POST',
      body: JSON.stringify({
          recipients: `${recipients}`,
          subject: `${subject}`,
          body: `${body}`
      })
      })
      .then(response => response.json())
      .then(result => {
          // Print result
          console.log(result);
          load_mailbox('sent')
      });
      event.preventDefault()
    }
  })

  // By default, load the inbox
  load_mailbox('inbox');
});


function compose_email() {

  // Show compose view and hide other views
  document.querySelector('#emails-view').style.display = 'none';
  document.querySelector('#compose-view').style.display = 'block';

  // Clear out composition fields
  document.querySelector('#compose-recipients').value = '';
  document.querySelector('#compose-subject').value = '';
  document.querySelector('#compose-body').value = '';

}

function load_mailbox(mailbox) {

  // Show the mailbox and hide other views
  document.querySelector('#emails-view').style.display = 'block';
  document.querySelector('#compose-view').style.display = 'none';

  // Show the mailbox name
  document.querySelector('#emails-view').innerHTML = `<h3>${mailbox.charAt(0).toUpperCase() + mailbox.slice(1)}</h3>`;

  const mailField = document.querySelector('#emails-view')

  fetch(`/emails/${mailbox}`)
  .then(response => response.json())
  .then(data => {
    console.log(data)
    for(const value of data){ // tyle razy stwórz maila

      const color = value['read'] ? 'white' : 'lightgray';

      mailField.innerHTML += `
        <div class="mail-wrapper" style="background-color: ${color}">
            <div><strong>From: ${value['sender']}</strong></div>
            <div>Subject: ${value['subject']}</div>
            <div class="mail-timestamp">${value['timestamp']}</div>
        </div>
      `;

    }
  })
  //document.querySelector('#emails-view').innerHTML +=
}
