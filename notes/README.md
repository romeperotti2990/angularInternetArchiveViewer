BUGS/ PROBLEMS: 
the search is still going by IA metadata and not just showing individual files based on seperate metadata assigned to it
sometimes the roms that are zips within the zips do not work.
You cannot search for books, only text. hopfully this will be fixed after they are listed individually also, just general junk being shown to you unless you know exactly what you want.
there are some files and filetypes that you can open in emulatorjs that have a high probability of not being a game so you download something you do not need
downloading things other than roms has it not show the progress until it is done, meaning the user has no feedback until the download is done
after clearing history there are a lot of visual bugs but everything works so its whatever (ITS BECAUSE ITS SAVING THE BLOB FROM HISTORY INSTEAD OF NORAMALLY WHYYYYYYYYYY)
there are a lot a lot of things wrong with the cbz reader but like it works at all so idc

FEATURES NEEDED:
emulatorjs (its essentially done, just having saving in game stay between sessions would be the only thing I would want, but this has proven incredibly hard in the past)
metadata provider/service
search filters (they are minimal rn)
search by filetype (we will have to look inside of zips, so it will have to search until it gets the amount of results as the pagination, then stop. this will still fetch a lot from internet archive and take a while, as it will have to use libarchive to peek into every one and extract it)
loading screens for pagination or a spinner (might not need it, might just want to have it show what it has loaded as it loads it)
you should be able to open the internet archive link normally (as in on internet archive itself) as well to see the source
deleting individual items from history
seeing the 'show files' button on the media page with the description, so you can look at other files in the collection other than the one that you are looking at


IDEAS:
maybe with the top change we could have several files for using media, instead of one big one
somtimes large items will take up the whole page so I could add minification/collapsing
sometimes there are a lot of files from a collection so I could make like an item page to look at the whole thing
favoriteing items so you can go back to them
a random button (filterable, of course)
I would like for you to be able to look at a collection and view all the content in that collection, like in internet archive
making queue of items (not roms, of course)
i want the maximum amount of file compatiblitiy but i am just one guy and i dont know how many systems i would have to make to be able for you to just view every little type of obscure filetype........

ASSIGNMENT REQIREMENTS:
only three small bugs maximum
app must be published (It is deployed on render, just some backend stuff is not working because of CORS [I don't care though, if you look hard enough you can usually find what you need in a non zipped format])
get 5 people to try it and give feedback (it never told me to fix the problems they find tho lol)
1. corbin went to the website on his phone so he just complained that it was not mobile optimized

COMMANDS:

ng serve
node server.js