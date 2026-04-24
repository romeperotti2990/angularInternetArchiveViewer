This is an internet archive view/use tool coded in angular using standalone components called Internet Archive Viewer (IAV for short). 
It is styled using tailwind.
It should be designed to search internet archive, take only the files and display them all with their own metadata from a different provider, and then use the files it finds without the user having to download them. 
For example, if I find a .gba file, we should be able to play it with emulator js, If I find a .mp3 file, I should be able to listen to it in the browser, etc etc.
It should also be able to see what is inside of .zip folders and use those as well.
USERS DO NOT NEED AN ACCOUNT OR AN EMAIL. it should just work. they can register using email or google oauth and it is stored in firebase. only if they want to.
Also, do not mess with anything in the 4.2.3 folder, its just a dependency. treat it the same as you would the node_modules folder.

INTENDED UX:
The user should go onto the site
the user should search for something in the bar at the top, filtering by filetype/mediatype. they should be able to filter by inculding or excluding filetypes
it should show lots of items filtered from files on internet archive (i'm thinking of abandoning the filtering idea, as it is proving difficult and it is kind of fun to find files yourself)
user clicks on an item and it shows more data about the item as well as a download and play/open button
the user should also be able to edit the items properties or delete items and it should be saved locally or in firestore
user clicks on play and whatever means of viewing the content is brought up, along with still a download button, the app should take note that the user went here in the users history(localstorage if no account)
If the user likes the media, they should be able to star it and save it to their favorites(localstorage if they do not have an account.)

STRUCTURE:
The current structure has components, pages, and services within their folders in /src/app.
each component/pages purpose is pretty self explanitory, but item does not do anything currently

INSTRUCTIONS:
Make your code as clean and small as possible. If a file gets too big (500+ lines) then you need to start thinking about splitting that file into multiple.
Make sure you do not cause errors in the code and that your code matches with all the other code that is already there.
Make sure your code is the same logically as other code in the workspace.

CURRENT STATE:
you can see inside of .zip files and other archives using libarchive.js. 
the search still just shows IA metadata and it is hard to find what you are looking for through all the podcast junk, unless you are looking for something specific
the app stores user data on firebase using firestore. it also supports google auth!
