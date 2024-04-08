document.addEventListener('DOMContentLoaded', function() {

  // Use buttons to toggle between views
  document.querySelector('#inbox').addEventListener('click', () => load_mailbox('inbox'));
  document.querySelector('#sent').addEventListener('click', () => load_mailbox('sent'));
  document.querySelector('#archived').addEventListener('click', () => load_mailbox('archive'));
  document.querySelector('#compose').addEventListener('click', compose_email);

  document.querySelector('#compose-view').addEventListener('submit', (event) => {
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
  document.querySelector('#mail-view').style.display = 'none';

  if(arguments.length === 3){
    document.querySelector('#compose-recipients').value = arguments[0];
    document.querySelector('#compose-subject').value = arguments[1];
    document.querySelector('#compose-body').value = arguments[2];
  } else{
    // Clear out composition fields
    document.querySelector('#compose-recipients').value = '';
    document.querySelector('#compose-subject').value = '';
    document.querySelector('#compose-body').value = '';
  }
}

function load_mailbox(mailbox) {

  // Show the mailbox and hide other views
  document.querySelector('#emails-view').style.display = 'block';
  document.querySelector('#compose-view').style.display = 'none';
  document.querySelector('#mail-view').style.display = 'none';

  // Show the mailbox name
  document.querySelector('#emails-view').innerHTML = `<h3>${mailbox.charAt(0).toUpperCase() + mailbox.slice(1)}</h3>`;

  const mailField = document.querySelector('#emails-view');

  fetch(`/emails/${mailbox}`)
  .then(response => response.json())
  .then(data => {
    console.log(data)
    for(const value of data){ // tyle razy stwórz maila

      const color = value['read'] ? 'white' : 'lightgray';

      mailField.innerHTML += `
        <div class="mail-wrapper" style="background-color: ${color}" onclick="view_email(${value['id']})">
          <div><strong>From: ${value['sender']}</strong></div>
          <div>Subject: ${value['subject']}</div>
          <div class="mail-timestamp">${value['timestamp']}</div>
        </div>
      `;
    }
  })
}

function view_email(id){
  document.querySelector('#emails-view').style.display = 'none';
  document.querySelector('#compose-view').style.display = 'none';
  document.querySelector('#mail-view').style.display = 'block';

  const mailField = document.querySelector('#mail-view');

  // zbierz dane z maila (fetch)
  fetch(`/emails/${id}`)
  .then(response => response.json())
  .then(email =>{
    console.log(email.id)

    if(email.id){
      const bodyLines = email.body.split('\n')

      const paragraphs = bodyLines.map((line) => {
        const paragraph = document.createElement('p')
        const textNode = document.createTextNode(line);
        paragraph.appendChild(textNode);
        return paragraph.outerHTML
      })
      const paragraphString = paragraphs.join('');

      mailField.innerHTML = `
        <div><strong>From: </strong>${email.sender}</div>
        <div><strong>To: </strong>${email.recipients}</div>
        <div><strong>Subject: </strong>${email.subject}</div>
        <div><strong>Timestamp: </strong>${email.timestamp}</div>
        <div id="buttons"></div>
        <hr>
        <div>${paragraphString}</div>
      `
      // mark email as read
      if(!email.read){
        fetch(`/emails/${email.id}`, {
          method: 'PUT',
          body: JSON.stringify({
              read: true
          })
        })
        .then(response => response.json());
      }

      //so much code inside of fetch because I didn't want users to archive/reply to their own messages
      fetch('/current_user')
      .then(response => response.json())
      .then((data) =>{
        console.log('data: ', data)
        const currentUser = data.email

        // not in sent inbox
        if(currentUser !== email.sender){
          console.log()
          console.log(email.sender)
          console.log(email)
          const archiveButton = document.createElement('div');
          archiveButton.className = 'btn btn-light'

          //email not archived
          if(!email.archived){
            archiveButton.innerHTML = 'Archive'

            archiveButton.addEventListener('click', () => {
              fetch(`/emails/${email.id}`, {
                method: 'PUT',
                body: JSON.stringify({
                    archived: true
                })
              })
              .then(response => response.json());
              view_email(email.id)
            })
          }
          // archived
          else{
            archiveButton.innerHTML = 'Unarchive'

            archiveButton.addEventListener('click', () => {
              fetch(`/emails/${email.id}`, {
                method: 'PUT',
                body: JSON.stringify({
                    archived: false
                })
              })
              .then(response => response.json());
              view_email(email.id)
            })
          }
          document.querySelector('#buttons').append(archiveButton) // surely it could be better designed

          const replyButton =  document.createElement('div');
          replyButton.innerHTML = 'Reply';
          replyButton.className = 'btn btn-light';

          let subject = email.subject;
          subject = (!/^re:/i.test(subject)) ? 're: ' + subject: subject;

          const body = `\n--------------\nOn ${email.timestamp} ${email.sender} wrote:\n${email.body}`
          replyButton.addEventListener('click', () => compose_email(
              email.sender,
              subject,
              body
          ))
          document.querySelector('#buttons').append(replyButton)
        }
      })


    } else{
      mailField.innerHTML = "Mail wasn't found. Contact the administrator. ";
    }

  })
}
