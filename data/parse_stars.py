#!/usr/bin/env python
import os
import re

"""Scrapes star database htmls from stellar-database.com
Expects a folder full of them. Returns a list of maps, each
one representing a star"""
def parse_stars(scrape_dir):
    stars = []
    exp = re.compile("<B>([^<>]*):</B>(.*)$")
    expCat = re.compile("^<BR>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;(.*)$")
    scrape_fnames = sorted(os.listdir(scrape_dir))
    for scrape_fname in scrape_fnames:
        if not scrape_fname.endswith('html'):
            continue
        print "Parsing %s"%scrape_fname
        # extract raw vals
        vals_raw = {}
        with open(os.path.join(scrape_dir,scrape_fname), 'r') as f:
            line = f.readline()
            while line != "":
                m = exp.search(line)
                if m:
                    vals_raw[m.group(1).strip()] = m.group(2).strip()
                m = expCat.search(line)
                if m:
                    vals_raw["Catalog numbers"] = m.group(1).strip()
                line = f.readline()
                    
        # parse out nice vals 
        try:
            vals = {}
            # coords
            v = vals_raw["Galactic (X,Y,Z) coordinates in ly"]
            ly_gal_coords = map(float, v.split(", "))
            vals["ly_galactic_x"] = ly_gal_coords[0]
            vals["ly_galactic_y"] = ly_gal_coords[1]
            vals["ly_galactic_z"] = ly_gal_coords[2]

            # name
            if "Proper names" in vals_raw:
                v = vals_raw["Proper names"]
            else:
                v = vals_raw["Catalog numbers"]
            names = map(str.strip, v.split(","))
            vals["name"] = names[0]
            
            # brightness
            vals["mag_absolute"] = vals_raw["Absolute visual magnitude"]
            vals["map_apparent"] = vals_raw["Apparent visual magnitude"]

            stars.append(vals)
        except Exception,e:
            print "Skipping star, parse error. %s"%e
    return stars
        

def print_csv(stars, fname):
    with open(fname, 'w') as f:
        headers = ["name",
            "ly_galactic_x","ly_galactic_y","ly_galactic_z"]
        f.write("%s\n"%(",".join(headers))) 
        for star in stars:
            row = map(lambda k: str(star[k]), headers)
            f.write("%s\n"%(",".join(row))) 
     
if __name__=="__main__":
    stars = parse_stars("stars/")
    print_csv(stars, "stars.csv")
    print "Done!"

