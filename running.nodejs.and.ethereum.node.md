
# Running NodeJS and Geth (Ethereum Node) on Ubuntu 16.04 server

## Update Ubuntu and install software needed on server

````sh
sudo apt update && sudo apt upgrade && sudo apt autoremove && sudo apt install -f
sudo apt install htop vim pydf mc
````

## Set environment variables

````sh
vim ~/.bashrc
````

add:

````
export ETHNODESSLKEY=/home/... privatekey.pem
export ETHNODESSLCERT=/home/...full_chain.pem
export APIKEY=...
````

run:
````sh
source ~/.bashrc
````

## Installing NodeJS

````sh
## see: https://nodejs.org/en/download/package-manager/#debian-and-ubuntu-based-linux-distributions
curl -sL https://deb.nodesource.com/setup_7.x | sudo -E bash -
sudo apt-get install -y nodejs
sudo apt install -y build-essential # needed for testrpc for example
sudo npm install -g npm # f.e. 3.3.12 > 3.4.1
````
See also:

https://www.digitalocean.com/community/tutorials/how-to-set-up-a-node-js-application-for-production-on-ubuntu-16-04

if need to use pm2

To use port 80 or 443 on NodeJS:

````sh
# check nodejs:
which nodejs
# if /usr/bin/nodejs :
sudo setcap 'cap_net_bind_service=+ep' /usr/bin/nodejs
````

## Run NodeJS

go to app dir and:

````sh
screen -mS NodeJS ./bin/www
````

## Installing Geth

````sh
sudo add-apt-repository -y ppa:ethereum/ethereum
sudo apt update
sudo apt install ethereum
geth version
````

See: https://geth.ethereum.org/install/

## Running Geth

````sh
screen -mS Geth geth --rpc --unlock 0
````

then input password in console

to start JavaScript Console:

````sh
geth attach
````


