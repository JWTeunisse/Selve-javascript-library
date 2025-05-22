# Selve-javascript-library
A Selve USB RF Gateway library to activate Selve Sun Screens, written in Javascript.
It supports the 2-way Commeo XML based protocol.
The Selve USB RF Gateway documentation can be downloaded from the www.selve.de website. Both in the English and German Language.
Besides the Selve Commeo multihandsender this library is used to automate the use of my Selve sunscreens depending on the weather conditions during the summer months and also from my mobile Android phone. 
This library is used in combination with nodejs webservices also written in Javascript. This webservice is part of my IoT home domotica.

Supported functions are:-
- sending a ping to the Gateway
- get the state of the gateway like is it ready, version information, etc.
- get the state of a screen
- activate a screen or a group of screens.
Not all the XML messages will be supported, only the important ones for me.

Before you can use the USB RF Gateway, you have to install the Selve Windows software CommeoUSBGatewayV2.exe (see the instruction on www.selve.de) on your PC or laptop. After you mount the USB stick into a USB Port and starting up the Commeo application, and getting an green LED light on the USB stick, you can include the screens into the stick. The way I used, was as follows:
- you have to interrupt the mains power to the screens for more than a second, after switching the power on, you have about 4 minutes to include the screens ;
- for the inclusion you use the Search receiver function.
In my situation I had to repeat this exercition because the last four screens were not close enough to the USB stick to receive the screen information. When all your screens are included, you can see them in the Selve application. 
Now you can activate the screens one by one with the Selve tool. After checking that all the screens are working with the USB stick,  I started by making groups of screens.
There 3 groups: The screen on the East (Oost) side and on the West side of our building. The 3rd group called All, containing all the screens.

I also noticed that the order of deviceId's are not the same as on my Commeo multi sender.
In the Commeo XML Logging window you can see and follow the starting XML commands like the ping command followed by the getstate command. When the Selve gateway stick gives the ready message (value 3), you can start with your own commands.

When I started this project, I looked into other Github projects like the (depcrecated) solution of tfohlmeister/homebridge-selve and Rintrium/ioBroker.selverf/tree/master.
As my demands are simple, I decided to design and program my own solution.
The relevant screen data is stored in a JSON file , an example is included in the repository.

To be continued, still work in progress.
JWT/2025-02-07, updated on 2025-03-04 (typing errors), 2025-05-22 (added function).

Copyright (c) 2024-2025 J.W. Teunisse (info@jwteunisse.nl)

Under the MIT license you can this software at you own risk. <aanvullen>
