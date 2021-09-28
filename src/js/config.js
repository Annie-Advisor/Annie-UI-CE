"use strict";

/* CONFIG
 * split into two:
 * - instance selectable values which are set earlier into variable INSTANCE_CONFIG
 * - the values that are same for all are in this file below
 *
 * We use jQuery function extend (deep) to unite the two:
 * - https://api.jquery.com/jquery.extend/#jQuery-extend-deep-target-object1-objectN
 * So, jQuery must be available at this point!
 */
let CONFIG = {};
$.extend(true,CONFIG,{
    "contactURI": "../dev/contact.php/",//fix according to environment
    "surveyURI": "../dev/survey.php/",//fix according to environment
    "messageURI": "../dev/message.php/",//fix according to environment
    "supportNeedURI": "../dev/supportneed.php/",//fix according to environment
    "contactsurveyURI": "../dev/contactsurvey.php/",//fix according to environment
    "commentURI": "../dev/comment.php/",//fix according to environment
    "codesURI": "../dev/codes.php/",//fix according to environment
    "metadataURI": "../dev/metadata.php/",//fix according to environment
    "sendsmsURI": "../dev/sendsms.php/",//fix according to environment
    
    "opintopolkuURI": "https://koodistopalvelu.fi/opintopolku.php/codeelement/latest/",//+ koodisto+"_"+koodi, e.g. "oppilaitosnumero_00000"
    /*->instance
    "updateInterval": 5,
    "itemsPerPage": 50,
    "studentTableOrder": ["status","-updated","contactdata.lastname","contactdata.firstname"],

    "smsSendEnabled": true,

    "timeout": 3, //generic timeout in seconds

    "languages": {
        "fi":"Suomeksi",
        //"en":"In English"
    },
    
    "columns":{
        // nb! fields inside JSON (column "data"/"contact") coming from student registry!
        "contact": {},
        "supportneed": {}
    },
    //*/
    "language": "fi",

    "i18n": {
        "title":"Annie.",
        "headline":{
            "title":{
                "fi":"Annie.",
                "en":"Annie."
            },
            "tag":{
                "fi":"Tuen tarpeen tunnistus",
                "en":"Untangle Student Support"
            },
            "logout":{
                "fi":"Kirjaudu ulos",
                "en":"Sign out"
            },
            "config":{
                "fi":"Asetukset",
                "en":"Settings",
                "itemsPerPage":{
                    "fi":"Rivejä sivulla",
                    "en":"Items per page"
                },
                "updateInterval":{
                    "fi":"Päivitystahti",
                    "en":"Update interval"
                },
                "lang":{
                    "fi":"Sivuston kieli",
                    "en":"Language"
                }
            },
            "body":{
                "fi":"opiskelijaa, jolla kaikki ok!",
                "en":"students with everything ok!"
            }
        },

        "content":{
            "setting":{
                "column":{
                    "fi":"Näytä sarakkeet",
                    "en":"Show columns"
                },
                "reset":{
                    "fi":"Palauta asetukset",
                    "en":"Restore settings"
                },
                "close":{
                    "fi":"Sulje",
                    "en":"Close"
                }
            },
            "search":{
                "fi":"Etsi",
                "en":"Search",
            },
            "filter":{
                "status":{
                    "fi":"Tila",
                    "en":"Status"
                }
            }
        },

        "booking":{
            "head":{
                "fi":"Ratkaistava asia",
                "en":"*EN*"
            },
            // some of the following could be in or used from columns!
            "survey":{
                "fi":"Kyselykierros",
                "en":"Survey"
            },
            "student":{
                "fi":"Opiskelija",
                "en":"Student"
            },
            "timespan":{
                "fi":"Ajankohta",
                "en":"Timespan"
            },
            "phonenumber":{
                "fi":"Puhelinnumero",
                "en":"Phone number"
            },
            "group":{
                "fi":"Ryhmä",
                "en":"Group"
            },
            "email":{
                // these are not in use?
                "fi":"Sähköpostiosoite",
                "en":"Email",
                "send":{
                    "fi":"Lähetä sähköpostia",
                    "en":"Send email"
                }
            },
            "sms":{
                "open":{
                    "fi":"Avaa/sulje tekstiviestin lähetys",
                    "en":"Open/close message sending"
                },
                "type":{
                    "fi":"Kirjoita tekstiviesti",
                    "en":"Write message"
                },
                "send":{
                    "fi":"Lähetä tekstiviesti",
                    "en":"Send message",
                    "success":{
                        "fi":"Viesti lähetetty!",
                        "en":"Message sent!"
                    },
                    "failed":{
                        "fi":"Viestin lähetys epäonnistui!",
                        "en":"Failed to send message!"
                    }
                },
                "unable":{
                    "fi":"Tekstiviestiä ei voi lähettää vielä",
                    "en":"Message can not be sent yet",
                    "text":{
                        "fi":"Kysely käynnissä. Tekstiviestiä ei voi lähettää vielä.",
                        "en":"There is an ongoing survey. Message can not be sent yet."
                    }
                }
            },
            "degree":{
                "fi":"Tutkinto",
                "en":"Degree"
            },
            "location":{
                "fi":"Toimipaikka",
                "en":"Location"
            },
            "category":{
                "fi":"Ratkaistava asia",
                "en":"Category"
            },
            "supportneed":{
                "fi":"Asia",
                "en":"Issue"
            },
            "status":{
                "fi":"Asian tila",
                "en":"Status"
            },
            "userrole":{
                "fi":"Käyttäjäryhmä",
                "en":"User role"
            },
            "events":{
                "fi":"Tapahtumahistoria",
                "en":"Event history",
                "message":{
                    "fi":"lähetti viestin",
                    "en":"sent message"
                },
                "supportneed":{
                    "fi":"käsitteli asiaa",
                    "en":"handled issue",
                    "status":{
                        "1":{
                            "fi":"lisäsi asian",
                            "en":"added issue"
                        },
                        "2":{
                            "fi":"merkitsi käsiteltäväksi asian",
                            "en":"marked issue to handling"
                        },
                        "100":{
                            "fi":"merkitsi ratkaistuksi asian",
                            "en":"marked issue resolved"
                        }
                    },
                    "category":{
                        "fi":"vaihtoi asiaksi",
                        "en":"changed issue to"
                    },
                    "userrole":{
                        "fi":"muutti käyttäjäryhmän asiaan",
                        "en":"change user role to issue"
                    }
                },
                "comment":{
                    "fi":"lisäsi kommentin",
                    "en":"added comment"
                }
            },
            "comment":{
                "fi":"Lisää kommentti",
                "en":"Add comment"
            },
            "tohandle":{
                "fi":"Palauta käsittelyyn",
                "en":"Return to handling"
            },
            "ready":{
                "fi":"Merkitse ratkaistuksi",
                "en":"Mark resolved"
            },
            "close":{
                "fi":"Sulje",
                "en":"Close"
            },
            "save":{
                "fi":"Tallenna",
                "en":"Save",
                "success":{
                  "fi":"TALLENNUS ONNISTUI",
                  "en":"SAVED SUCCESSFULLY"
                },
                "failed":{
                  "fi":"TALLENNUS EPÄONNISTUI",
                  "en":"SAVING FAILED"
                }
            }
        }
    }
}
,INSTANCE_CONFIG);//-extend
