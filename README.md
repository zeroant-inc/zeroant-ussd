# zeroant

THE JS WEAPON

# sample

<pre>
    import express from "express";
    import { expressDispatcher , Action, Dispatcher} from "zeroant-ussd";
    const app = express();
    const dispatcher = new Dispatcher({
        delimiter:"*"
    });

    dispatcher.register("",new Action((event)=>{
        console.log(event);
        // default fall back
        return [
        `CON WELCOME TO USSD TEST FRAMEWORK`,
        `1 SIGNUP`,
        "2 HELP"
        ];
    }));
    dispatcher.register("a",new Action((event)=>{
        console.log(event);
        return "END i was here";
    }));
    dispatcher.register("1",new Action((event)=>{
        console.log(event);
        return `What is Your Name`;
    }));
    dispatcher.register("1*&lt;name:string&gt;",new Action((event)=>{
        console.log(event);
        return `What is Your Email`;
    }));
    dispatcher.register("1*&lt;name:string&gt;*&lt;email:string&gt;",new Action((event)=>{
        console.log(event);
        return [
        `YOUR PROFILE HAVE BEEN CREATED`,
        `NAME:${event.params.name}`,
        `EMAIL:${event.params.email}`
        ];
    }));
    dispatcher.register("2",new Action((event)=>{
    console.log(event);
    return [
        `WELCOME TO YOUR HELP PAGE`,
    `PELASE ENTER YOUR USERNAME:`
    ];
    }));
    dispatcher.register("2*:user",new Action((event)=>{
        console.log(event);
        return [
            `YOUR  USERNAME IS`,
        `${event.params.user}`
        ];
    }));
    dispatcher.register("(.?)",new Action((event)=>{
        console.log(event);
        // default fall back
        return [`END THANK YOU FOR USING USSD TEST FRAMEWORK`];
    }).on('before',(event)=>{
        console.log("Event BEFORE START");
        if(event.data){
            return [`END AN ERROR OCCURE WHILE TRYING TO COMPLETE YOUR REQUEST`]
        }
    }).on('after',(event)=>{
        console.log(event,"Event Ended");
    }));
    app.use(expressDispatcher(dispatcher));
    app.listen(process.env.PORT || 3000,()=>{
        console.log(`Application listening on port ${process.env.PORT || 3000}`);
    })
</pre>
