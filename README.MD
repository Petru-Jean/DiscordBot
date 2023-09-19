Client-based solution that manages WebSocket connections to discord's Gateway API.

Caches Discord Guild member data using Redis, allows custom command request/response and automatically broadcasts recieved events for each Guild.

Contains an example implementation of an Activity Bot that logs User message and Voice activity for each Guild. The data can be accesed for each guild using the /stats command. 
