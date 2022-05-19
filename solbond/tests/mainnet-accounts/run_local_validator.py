import os 
from os import listdir
from os import walk
import json 
import subprocess
import base64
import base58
from anchorpy import Provider

state_path = "./state"
programs_path = "programs"

provider = Provider.local()
pubkey = str(provider.wallet.public_key) #"2kvxryujoi4hk9r5XkFNQ5JNDWPMYuUEz79Lk4cim4iT"
print(pubkey)
state_addr = []
state_names = []
cmd = "solana-test-validator "

for s in listdir(state_path):
    filename = os.fsdecode(s)
    f = open(state_path + "/" + filename)
    data = json.load(f)

    addr = data["pubkey"]
    state_addr.append(addr)
    state_names.append(filename)
    # if its a mint, make mint authority to pubkey 
    tokens = filename.split("_")
    if tokens[1] == "mintAddress.json":
        data_tmp = bytearray(base64.b64decode(data["account"]["data"][0]))
        data_tmp[4:4+32] = base58.b58decode(pubkey)
        print(base64.b64encode(data_tmp))
        data['account']['data'][0] = base64.b64encode(data_tmp).decode('utf8')
        json.dump(data, open(str(state_path + "/" + filename), "w"))
    cmd += "--account" + " " + str(addr) + " " + str(state_path + "/" + filename) + " "


programs = {
    "solend.so": "So1endDq2YkqhipRh3WViPa8hdiSpxWy6z3Z6tMCpAo",
    "marinade.so": "MarBmsSgKXdrN1egZf5sqe1TMai9K1rChYNDJgjq7aD",
    "saber.so": "SSwpkEEcbUqx4vtoEByFjSkhKdCT862DNVb52nZg1UZ"
}

for name in programs:
    cmd += "--bpf-program" + " " + programs[name] + " " + programs_path + "/" + name + " "

cmd += "--reset"
print(cmd)

process = subprocess.Popen(cmd.split(), stdout=subprocess.PIPE)

while True:
    output = process.stdout.readline()
    print(output.strip())
    # Do something else
    return_code = process.poll()
    if return_code is not None:
        print('RETURN CODE', return_code)
        # Process has finished, read rest of the output 
        for output in process.stdout.readlines():
            print(output.strip())
        break




