BUGS/ PROBLEMS: (things that are active issues with the app)
    METADATA: (related to the immpossible problem in plan.txt)
    the search is still going by IA metadata and not just showing individual files based on seperate metadata assigned to it
    You cannot search for books, only text. hopfully this will be fixed after they are listed individually also, just general junk being shown to you unless you know exactly what you want.
    there are some files and filetypes that you can open in emulatorjs that have a high probability of not being a game so you download something you do not need (.iso, .img, etc)
    a lot of times when attempting to view files considered as "other"(torrents, other strange filetypes) it just leaves the viewer box empty and downloads the file(like the way I want every other file to download too). idk what the page should do though, as you cant view these files

    GENERAL:
    sometimes the roms that are zips within the zips do not work.
    there are a lot a lot of things wrong with the cbz reader but like it works at all so idc
    when selecting files from the same collection in the media page they all count as different items in the history so the top bar gets filled up with the same name several times
    sometimes items in the favorites will show up as the localhost version but idk why and it fixes itself as soon as you click on it and go back
    there is some weird favorite syncing stuff if you are looking at/playing files in zips because the zip and the file inside it count as different items, I think to fix this I will just make it so you cant favorite zips
    uhhh you can favorite entire collections in the search page and idk how that works
    there is lots of duplacate code in search and media that could probably be moved to files

    UI/UX:
    When you favorite and unfavorite things in the home page its a little snappy
    you cant undo unfavoriteing the item is just gone

    SHOW FILES:
    The UI in the items component is small and hard to use

    ACCOUNTS:
    uhhhhh i just realized there is
    no customization
    you cant delete your account
    you cant export your data

    DOWNLOADING:
    when pressing download on an item in the media page, it does not show you anything until it is done.
    when pressing download on a file in a collection using the show files button, it just opens it using the server on that tab.(this does give you an option to download it, but it redirected you away from the website, and the user would have to figure that out)


FEATURES NEEDED: (things that need to be done that dont break anything, but would greatly add to the app)
    FUNCTIONALITY:
    search filters (they are minimal rn)
    emulatorjs (its essentially done, just having saving in game stay between sessions would be the only thing I would want, but this has proven incredibly hard in the past)
    metadata provider/service (might want to give up on that)\
    search by filetype (we will have to look inside of zips, so it will have to search until it gets the amount of results as the pagination, then stop. this will still fetch a lot from internet archive and take a while, as it will have to use libarchive to peek into every one and extract it)
    you should be able to open the internet archive link normally (as in on internet archive itself) as well to see the source (idk why this is so hard to do)
    a section/page that shows all the emulator files you have still downloaded in the browser (cached)
    cancelling peeking archives

    UX/UI:
    loading screens for pagination or a spinner (might not need it, might just want to have it show what it has loaded as it loads it)
    gennerally the site looks bad because i did none of it myself
    Fullscreen view for images and whatnot
    A next button for the media page that will go to and show the next file


IDEAS: (things that could be done but nessicarily need to be)
    FEATURES:
    a random button (filterable, of course)
    making queue of items (not roms, of course)
    A favorites page
    thumbnails for files and whatnot
    custom descriptions for things, for example i could rename something localy
    
    UX/UI:
    if an archive is taking a while to be peeked, it should tell you and say "this is taking a while, maybe should cancel it" or something like that
    A description of every filetype that you can view in the media page, so you know what you are actually looking at. It could also have tips on how to use it
    I am only using the pixel font in 2 places but it looks REALLY GOOD so i am thinking I should add a pixel athstetic to the whole site but i'm not sure how to do that


    CODE:
    I could have several files for using media, instead of one big one


ASSIGNMENT REQIREMENTS:
    GENERAL:
    I should probably use pwa for stuff too blehhhhhh (not an actual reqirement)
    only three small bugs maximum (small being described as something affecting functionality, if I dont mention the .cbz reader, everything is fine for the most part)
    app must be published (DONE)
    get 5 people to try it and give feedback (DONE)
    user auth(DONE)

    FEEDBACK:
    1. corbin went to the website on his phone so he just complained that it was not mobile optimized and that the emulator didnt work(PLUHHHHHH)
    2. thomas said the blue button in the homepage does not work and mentioned the spa deployment issue(both of which I fixed)
    3. graydon back button in the login page, add google logo, add feedback to the buttons, minification(which I did), make search better(I did), get rid of the tab(I think I did?), 'make it look cool'(fair)
    4. callin said "the icons at the top a little crowded on mobile" and was confused about the purpose
    5. Korman said "Instead of no results it should say start searching or something close to that"(did it)


DEPLOYMENT PROBLEMS:
- IT ALL FIXED ITSELF WTF????
- if you go to the web service and wake it up first then it will all work, otherwise there are a ton of problems. I just need a way to make the web service wake up after you visit the static site. I just need to add a spinner to the static site that shows the status of the web service


COMMANDS:

ng serve
node server.js