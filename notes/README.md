BUGS/ PROBLEMS: (things that are active issues with the app)
    METADATA: (related to the immpossible problem in plan.txt)
    the search is still going by IA metadata and not just showing individual files based on seperate metadata assigned to it
    You cannot search for books, only text. hopfully this will be fixed after they are listed individually also, just general junk being shown to you unless you know exactly what you want.
    there are some files and filetypes that you can open in emulatorjs that have a high probability of not being a game so you download something you do not need (.iso, .img, etc)
    because some systems use the same filetype emulatorjs can get the core wrong, for example psx and sega genisis

    GENERAL:
    there are a lot a lot of things wrong with the cbz reader but like it works at all so idc
    when selecting files from the same collection in the media page they all count as different items in the history so the top bar gets filled up with the same name several times
    uhhh you can favorite entire collections in the search page and idk how that works
    sometimes the favorites function in the files acts oddly until you reload the page
    the peek canncelling feature probably does not work, I just really have not gotten the chance to test it, its not needed often

    UI/UX:
    When you favorite and unfavorite things in the home page its a little snappy
    the extraction bar never seems to do anything else but go from 10 to 30 then to full after a long wait. I dont think its actually showing the extraction progress
    because the top nav history just shows the collection name it sometimes is not very acurate to what you will see when you click on it. I should make it show the item name or something else.

    SHOW FILES:
    The UI in the items component is small and hard to use

    ACCOUNTS:
    there is no customization
    the account page does not match the rest of the website

    DOWNLOADING:
    when pressing download on an item in the media page, it does not show you anything until it is done.
    when pressing download on a file in a collection using the show files button, it just opens it using the server on that tab.(this does give you an option to download it, but it redirected you away from the website, and the user would have to figure that out) there is also a download button on many filetypes within the player anyway


FEATURES NEEDED: (things that need to be done that dont break anything, but would greatly add to the app)
    FUNCTIONALITY:
    search filters (they are minimal rn)
    emulatorjs (its essentially done, just having saving in game stay between sessions would be the only thing I would want, but this has proven incredibly hard in the past)
    metadata provider/service (might want to give up on that)
    search by filetype (we will have to look inside of zips, so it will have to search until it gets the amount of results as the pagination, then stop. this will still fetch a lot from internet archive and take a while, as it will have to use libarchive to peek into every one and extract it)
    you should be able to open the internet archive link normally (as in on internet archive itself) as well to see the source (idk why this is so hard to do)


    UX/UI:
    gennerally the site looks bad because i did none of it myself (besides the pixel font)
    Fullscreen view for images and whatnot
    A next button for the media page that will go to and show the next file


IDEAS: (things that could be done but nessicarily need to be)
    FEATURES:
    a random button (filterable, of course)
    making queue of items (not roms, of course)
    A favorites page
    thumbnails for files and whatnot
    custom descriptions for things, for example i could rename something localy
    page that explains what several filetypes are, or a description section in media
    the history page hsould show the full item descriptions like there used to be
    
    UX/UI:
    if an archive is taking a while to be peeked, it should tell you and say "this is taking a while, maybe should cancel it" or something like that
    A description of every filetype that you can view in the media page, so you know what you are actually looking at. It could also have tips on how to use it
    if you could drag and rearrange the favorites on the home screen that would be cool
    if your search ends up with something you already have favorited it should end up at the top
    have a pixel art icon for the favorite star?


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