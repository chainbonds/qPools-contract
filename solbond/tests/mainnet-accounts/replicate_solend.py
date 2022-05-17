import os 
from os import listdir
from os import walk
import json 
import subprocess

state_path = "./state"
programs_path = "programs"


cmd = "solana account -u m --output json-compact --output-file "
commands = []
markets = {}
with open ("SolendMarket.json") as solendMarket:
    data = json.load(solendMarket)
    for v in data:
        elem = v.copy()
        ticker = elem["asset"]
        del elem["asset"]
        try:
            del elem["userSupplyCap"]
        except:
            pass
        del elem["name"]
        del elem["symbol"]
        del elem["decimals"]
        del elem["logo"]
        markets[ticker] = elem

for ticker in markets.keys():
    elem = markets[ticker]
    ticker_name = str(ticker)
    print("ticker {}".format(ticker_name))
    for k in elem.keys():
        key_name = str(k)
        print(key_name)
        tmp_cmd = cmd + ticker_name + "_" + key_name + ".json" + " " + elem[k]
        print("constructed command {}".format(tmp_cmd))
        commands.append(tmp_cmd)

process = subprocess.Popen("cd state/".split(), stdout=subprocess.PIPE)
result=process.stdout.readlines()

for command in commands:
    process = subprocess.Popen(command.split(), stdout=subprocess.PIPE)
    result=process.stdout.readlines()
    if len(result) >= 1:
        for line in result:
            print(line.decode("utf-8"))

