#!/bin/bash
for i in {1..2248};
do 
    url="http://www.stellar-database.com/Scripts/search_star.exe?ID=${i}00"
    echo  "Downloading $url"
    wget $url -O stars/$i.html
done
echo "Done!"
