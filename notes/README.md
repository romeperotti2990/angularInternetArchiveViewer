BUGS/ PROBLEMS: 
    GENERAL:
    the search is still going by IA metadata and not just showing individual files based on seperate metadata assigned to it
    sometimes the roms that are zips within the zips do not work.
    You cannot search for books, only text. hopfully this will be fixed after they are listed individually also, just general junk being shown to you unless you know exactly what you want.
    there are some files and filetypes that you can open in emulatorjs that have a high probability of not being a game so you download something you do not need (.iso, .img, etc)
    downloading things other than roms has it not show the progress until it is done, meaning the user has no feedback until the download is done
    there are a lot a lot of things wrong with the cbz reader but like it works at all so idc
    a lot of times when attempting to view files considered as "other"(torrents, other strange filetypes) it just leaves the viewer box empty and downloads the file. idk what the page should do though, as you cant view these files
    after searching for a file that is already favorited, you can find it again and it will not recognise it as the same file (this causes many issues)
    
    UI:
    sometimes the show more option is shown when it does not need to be but this is a small bug its fine

    
    MEDIA PAGE:
    when selecting files from the same collection in the media page they all count as different items in the history so the top bar gets filled up
    on the media page show files it does not show if a file is already starred or not, they just all end up not starred this is because ↓
    the files within the show files on the media page count as different items than the ones on the search page
    the show files on the media page looks wildly different than on the search page

    ACCOUNTS:
    uhhhhh i just realized there is
    no customization
    you cant delete your account
    you cant export your data

FEATURES NEEDED:
emulatorjs (its essentially done, just having saving in game stay between sessions would be the only thing I would want, but this has proven incredibly hard in the past)
metadata provider/service (might want to give up on that)
search filters (they are minimal rn)
search by filetype (we will have to look inside of zips, so it will have to search until it gets the amount of results as the pagination, then stop. this will still fetch a lot from internet archive and take a while, as it will have to use libarchive to peek into every one and extract it)
loading screens for pagination or a spinner (might not need it, might just want to have it show what it has loaded as it loads it)
you should be able to open the internet archive link normally (as in on internet archive itself) as well to see the source
after pressing close files it should not have to fetch what is there again it should be cached for as long as you are on the page
a section/page that shows all the emulator files you have still downloaded in the browser (cached)
gennerally the site looks bad because i did none of it myself
add minification to history items
cancelling peeking archives

IDEAS:
    FEATURES:
    sometimes there are a lot of files from a collection so I could make like an item page to look at the whole thing
    a random button (filterable, of course)
    I would like for you to be able to look at a collection and view all the content in that collection, like in internet archive
    making queue of items (not roms, of course)

    UI:
    on the search page if you have not searched anything it should tell you to search for something instead of the default nothing found message

    CODE:
    we could have several files for using media, instead of one big one


ASSIGNMENT REQIREMENTS:
I should probably use pwa for stuff too blehhhhhh (not an actual reqirement)
only three small bugs maximum (small being described as something affecting functionality, if I dont mention the .cbz reader, everything is fine for the most part)
app must be published (DONE)
get 5 people to try it and give feedback (DONE)
1. corbin went to the website on his phone so he just complained that it was not mobile optimized(PLUHHHHHH)
2. thomas said the blue button in the homepage does not work and mentioned the spa deployment issue(both of which I fixed)
3. graydon back button in the login page, add google logo, add feedback to the buttons, minification(which I did), make search better(????), get rid of the tab(tab?????), 'make it look cool'(fair)
4. callin said "the icons at the top a little crowded on mobile" and was confused about the purpose
5. Korman said "Instead of no results it should say start searching or something close to that"
user auth(DONE)


DEPLOYMENT PROBLEMS:
- IT ALL FIXED ITSELF WTF????
- if you go to the web service and wake it up first then it will all work, otherwise there are a ton of problems. I just need a way to make the web service wake up after you visit the static site. I just need to add a spinner to the static site that shows the status of the web service


COMMANDS:

ng serve
node server.js