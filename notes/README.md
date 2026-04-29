BUGS/ PROBLEMS: 
the search is still going by IA metadata and not just showing individual files based on seperate metadata assigned to it
sometimes the roms that are zips within the zips do not work.
You cannot search for books, only text. hopfully this will be fixed after they are listed individually also, just general junk being shown to you unless you know exactly what you want.
there are some files and filetypes that you can open in emulatorjs that have a high probability of not being a game so you download something you do not need
downloading things other than roms has it not show the progress until it is done, meaning the user has no feedback until the download is done
after clearing history there are a lot of visual bugs but everything works so its whatever (ITS BECAUSE ITS SAVING THE BLOB FROM HISTORY INSTEAD OF NORAMALLY WHYYYYYYYYYY)
there are a lot a lot of things wrong with the cbz reader but like it works at all so idc
the star icon looks odd on the history page
you cannot close the files after you press show files on the search page (same thing with archives[zips, rars, etc])
somehow there can be duplicate items in the history and favorites with this ↓
after you clear history and then keep a favorite file, it goes into this strange state where it is no longer associated with its collection, so on the media page the desc will not be there, and it just shows the blob link in the homepage until you view it again. also many times when updating the way items work I have to re-find many items because they enter this state
a lot of times when attempting to view files considered as "other"(torrents, other strange filetypes) it just leaves the viewer box empty and downloads the file
when selecting files from the same collection in the media page they all count as different items in the history so the top bar gets filled up

FEATURES NEEDED:
emulatorjs (its essentially done, just having saving in game stay between sessions would be the only thing I would want, but this has proven incredibly hard in the past)
metadata provider/service
search filters (they are minimal rn)
search by filetype (we will have to look inside of zips, so it will have to search until it gets the amount of results as the pagination, then stop. this will still fetch a lot from internet archive and take a while, as it will have to use libarchive to peek into every one and extract it)
loading screens for pagination or a spinner (might not need it, might just want to have it show what it has loaded as it loads it)
you should be able to open the internet archive link normally (as in on internet archive itself) as well to see the source
deleting individual items from history

IDEAS:
maybe with the top change we could have several files for using media, instead of one big one
sometimes there are a lot of files from a collection so I could make like an item page to look at the whole thing
a random button (filterable, of course)
I would like for you to be able to look at a collection and view all the content in that collection, like in internet archive
making queue of items (not roms, of course)
i want the maximum amount of file compatiblitiy but i am just one guy and i dont know how many systems i would have to make to be able for you to just view every little type of obscure filetype........

ASSIGNMENT REQIREMENTS:
I should probably use pwa for stuff too blehhhhhh
only three small bugs maximum
app must be published (It is deployed on render, just some backend stuff is not working because of CORS [I don't care though, if you look hard enough you can usually find what you need in a non zipped format])
get 5 people to try it and give feedback (it never told me to fix the problems they find tho lol)
1. corbin went to the website on his phone so he just complained that it was not mobile optimized(PLUHHHHHH)
2. thomas said the blue button in the homepage does not work and mentioned the spa deployment issue(both of which I fixed)
3. graydon back button in the login page, add google logo, add feedback to the buttons, minification(which I did), make search better(????), get rid of the tab(tab?????), 'make it look cool'(fair)
4. callin said "the icons at the top a little crowded on mobile" and was confused about the purpose
5. 

DEPLOYMENT PROBLEMS:
- pressing 'open raw' just trys to open localhost and not the web service
- the open raw and libarchive stuff is not working because it is not taking from the web service on render for some reason
- some things cause CORS issues for some reason, like the cbz reader and trying to use libarchive
- the firebase stuff is not syncing between the local and deployment but thats more of a me problem


COMMANDS:

ng serve
node server.js