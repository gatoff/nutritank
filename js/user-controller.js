// Fill in with your values
const AUTH0_CLIENT_ID = 'eOJ5WLYQLvUaxWR6PLOvGA0WOz8GF67_';
const AUTH0_DOMAIN = 'nutritank.auth0.com';
const AUTH0_CALLBACK_URL = window.location.href; // eslint-disable-line
const PUBLIC_ENDPOINT = 'https://veuu3skq7h.execute-api.us-west-2.amazonaws.com/dev/api/public';
const PRIVATE_ENDPOINT = 'https://veuu3skq7h.execute-api.us-west-2.amazonaws.com/dev/api/private';

var lock = new Auth0Lock('AUTH0_CLIENT_ID', 'AUTH0_DOMAIN', {
  //code omitted for brevity
  configurationBaseUrl: 'https://cdn.auth0.com'
  //code omitted for brevity
});

var userController = {
    data: {
        auth0Lock: null,
        config: null
    },
    uiElements: {
        loginButton: null,
        logoutButton: null,
        profileButton: null,
        profileNameLabel: null,
        profileImage: null,
        privateLink: null
    },
    init: function (config) {
        this.uiElements.loginButton = $('.auth0-login');
        this.uiElements.privateLink = $('.private');
        this.uiElements.logoutButton = $('#auth0-logout');
        this.uiElements.profileButton = $('#user-profile');
        this.uiElements.profileNameLabel = $('#profilename');
        this.uiElements.profileImage = $('#profilepicture');
        this.uiElements.toolboxLink = $('a[href="toolbox/"]')
        this.uiElements.communityLink = $('a[href="community/"]')

        this.data.config = config;
        var params = {
            autoclose: true,
            auth: {
                params: {
                    scope: 'openid profile email user_metadata picture'
                },
                responseType: 'id_token token'
            }
        };
        this.data.auth0Lock = new Auth0Lock(config.auth0.clientId, config.auth0.domain, params);
          configurationBaseUrl: 'https://cdn.auth0.com'

        // check to see if the user has previously logged in
        var accessToken = localStorage.getItem('accessToken');
        var idToken = localStorage.getItem('idToken');

        this.wireEvents();

        if (accessToken && idToken) {
            this.getUserProfile(accessToken, idToken);
        }

    },
    configureAuthenticatedRequests: function () {
        $.ajaxSetup({
            'beforeSend': function (xhr) {
                xhr.setRequestHeader('Authorization', 'Bearer ' + localStorage.getItem('idToken'));
            }
        });
    },
    getUserProfile: function (accessToken, idToken) {
        var that = this;
        this.data.auth0Lock.getUserInfo(accessToken, function (error, profile) {

            if (error) {
                return alert('There was an error getting the profile: ' + error.message);
            }

            that.configureAuthenticatedRequests();
            that.showUserAuthenticationDetails(profile);

        });
    },
    showUserAuthenticationDetails: function (profile) {
        var showAuthenticationElements = !!profile;

        if (showAuthenticationElements) {
            this.uiElements.profileNameLabel.text(profile.nickname || profile.email);
            this.uiElements.profileImage.attr('src', profile.picture);
        }

        this.uiElements.loginButton.toggle(!showAuthenticationElements);
        this.uiElements.logoutButton.toggle(showAuthenticationElements);
        this.uiElements.profileButton.toggle(showAuthenticationElements);
    },
    wireEvents: function () {
        var that = this;

        this.uiElements.loginButton.click(function (e) {
            that.data.auth0Lock.show();
        });

        this.uiElements.toolboxLink.click(function (e) {
          console.log("responding to toolbox request")
          console.log(e)
          var url = that.data.config.apiBaseUrl + '/' + e.a[href];
          var accessToken = localStorage.getItem('accessToken');
          var data = {
              accessToken: accessToken,
              url: url
          };
          fetch(PRIVATE_ENDPOINT, {
            method: 'POST',
            body: data,
            headers: {
              Authorization: `Bearer ${idToken}`,
            },
          })
            .then(response => response.json())
            .then((data) => {
              console.log('Token:', data);
              document.getElementById('message').textContent = '';
              document.getElementById('message').textContent = data.message;
            })
            .catch((e) => {
              console.log('error', e);
            });
        });

        this.uiElements.logoutButton.click(function (e) {
            localStorage.removeItem('accessToken');
            localStorage.removeItem('idToken');

            that.uiElements.logoutButton.hide();
            that.uiElements.profileButton.hide();
            that.uiElements.loginButton.show();
        });

        this.data.auth0Lock.on('authenticated', function (authResult) {
            localStorage.setItem('accessToken', authResult.accessToken);
            localStorage.setItem('idToken', authResult.idToken);
            that.getUserProfile(authResult.accessToken, authResult.idToken);
        });

        this.uiElements.profileButton.click(function (e) {

            var url = that.data.config.apiBaseUrl + '/user-profile';
            var accessToken = localStorage.getItem('accessToken');
            var data = {
                accessToken: accessToken
            };
            var button = $(this);
            button.button('loading');

            $.get(url, data).done(function (data, status) {
                // save user profile data in the modal
                $('#user-profile-raw-json').text(JSON.stringify(data, null, 2));
                $('#user-profile-modal').modal();
                button.button('reset');
            }).fail(function (error) {
                alert('Can\'t retreive user information');
                button.button('reset');
                console.error(error);
            });
        });
    }
};
