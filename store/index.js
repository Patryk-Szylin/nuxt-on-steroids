import Vuex from "vuex";
import Cookie from "js-cookie";
import firebase from "~/plugins/fireinit";

const createStore = () => {
  return new Vuex.Store({
    state: {
      loadedPosts: [],
      token: null,
      fbUser: {}
    },
    mutations: {
      setPosts(state, posts) {
        state.loadedPosts = posts;
      },
      addPost(state, post) {
        state.loadedPosts.push(post);
      },
      editPost(state, editedPost) {
        const postIndex = state.loadedPosts.findIndex(
          post => post.id === editedPost.id
        );
        state.loadedPosts[postIndex] = editedPost;
      },
      setToken(state, token) {
        state.token = token;
      },
      clearToken(state) {
        state.token = null;
        state.fbUser = null;
      },
      setFacebookUser(state, payload) {
        state.fbUser = payload;
      }
    },
    actions: {
      nuxtServerInit(vuexContext, context) {
        return context.app.$axios
          .$get("/posts.json")
          .then(data => {
            const postsArray = [];
            for (const key in data) {
              postsArray.push({ ...data[key], id: key });
            }
            vuexContext.commit("setPosts", postsArray);
          })
          .catch(e => context.error(e));
      },
      addPost(vuexContext, post) {
        const createdPost = {
          ...post,
          updatedDate: new Date()
        };
        console.log(vuexContext.state.token);
        return this.$axios
          .$post(
            "https://nuxt-project-e2a61.firebaseio.com/posts.json?auth=" +
              vuexContext.state.token,
            createdPost
          )
          .then(data => {
            vuexContext.commit("addPost", { ...createdPost, id: data.name });
          })
          .catch(e => console.log(e));
      },
      editPost(vuexContext, editedPost) {
        return this.$axios
          .$put(
            "https://nuxt-project-e2a61.firebaseio.com/" +
              editedPost.id +
              ".json?auth=" +
              vuexContext.state.token,
            editedPost
          )
          .then(res => {
            vuexContext.commit("editPost", editedPost);
          })
          .catch(e => console.log(e));
      },
      setPosts(vuexContext, posts) {
        vuexContext.commit("setPosts", posts);
      },
      authenticateUser(vuexContext, authData) {
        let authUrl =
          "https://www.googleapis.com/identitytoolkit/v3/relyingparty/verifyPassword?key=AIzaSyDVJu1mz1_TQ2bcvI7Af7Lf868a3riHlTg";

        if (!authData.isLogin) {
          authUrl =
            "https://www.googleapis.com/identitytoolkit/v3/relyingparty/signupNewUser?key=AIzaSyDVJu1mz1_TQ2bcvI7Af7Lf868a3riHlTg";
        }

        return this.$axios
          .$post(authUrl, {
            email: authData.email,
            password: authData.password,
            returnSecureToken: true
          })
          .then(res => {
            let expDate =
              new Date().getTime() + Number.parseInt(res.expiresIn) * 1000;
            vuexContext.commit("setToken", res.idToken);
            localStorage.setItem("token", res.idToken);
            localStorage.setItem("tokenExpiration", expDate);

            Cookie.set("jwt", res.idToken);
            Cookie.set("expDate", expDate);
          })
          .catch(e => {
            console.log(e);
          });
      },
      initAuth(vuexContext, req) {
        let token;
        let expirationDate;
        let user = {
          firstName: ""
        };

        if (req) {
          if (!req.headers.cookie) {
            return;
          }

          // console.log(req.headers.cookie);
          const jwtCookie = req.headers.cookie
            .split(";")
            .find(c => c.trim().startsWith("jwt="));
          const firstName = req.headers.cookie
            .split(";")
            .find(c => c.trim().startsWith("firstName="));

          if (!jwtCookie) {
            return;
          }

          token = jwtCookie.split("=")[1];
          user.firstName = firstName.split("=")[1];
          // expirationDate = req.headers.cookie
          //   .split(";")
          //   .find(c => c.trim().startsWith("expDate="))
          //   .split("=")[1];
        } else {
          token = localStorage.getItem("token");
          user.firstName = localStorage.getItem("firstName");
          expirationDate = localStorage.getItem("tokenExpiration");
        }

        // if (new Date().getTime() > +expirationDate || !token) {
        //   vuexContext.dispatch("logout");
        //   return;
        // }

        // console.log(token);
        vuexContext.commit("setToken", token);
        vuexContext.commit("setFacebookUser", user);
      },
      logout({ commit }) {
        commit("clearToken");
        Cookie.remove("jwt");
        Cookie.remove("expDate");
        Cookie.remove("firstName");

        if (process.client) {
          localStorage.removeItem("token");
          localStorage.removeItem("firstName");
          localStorage.removeItem("tokenExpiration");
        }
      },
      getUserData({ commit, state }) {
        this.$axios
          .$post(
            "https://www.googleapis.com/identitytoolkit/v3/relyingparty/getAccountInfo?key=AIzaSyDVJu1mz1_TQ2bcvI7Af7Lf868a3riHlTg",
            { idToken: state.token }
          )
          .then(res => {
            console.log(res);
          })
          .catch(e => console.log(e));
      },
      updateUserData({ commit, state }, payload) {
        this.$axios
          .$post(
            "https://www.googleapis.com/identitytoolkit/v3/relyingparty/setAccountInfo?key=AIzaSyDVJu1mz1_TQ2bcvI7Af7Lf868a3riHlTg",
            {
              photoUrl: payload.photoUrl,
              idToken: payload.token,
              displayName: payload.displayName,
              returnSecureToken: payload.returnSecureToken
            }
          )
          .then(res => {
            console.log(res);
          })
          .catch(e => {
            console.log(e);
          });
      },
      facebookLogin(vuexContext, user) {
        return new Promise((resolve, reject) => {
          var provider = new firebase.auth.FacebookAuthProvider();
          firebase
            .auth()
            .signInWithPopup(provider)
            .then(res => {
              var token = firebase.auth().currentUser._lat;
              var user = {
                firstName: res.additionalUserInfo.profile.first_name
              };

              vuexContext.commit("setFacebookUser", user);
              vuexContext.commit("setToken", token);
              localStorage.setItem("token", token);
              localStorage.setItem("firstName", user.firstName);
              Cookie.set("jwt", token);
              Cookie.set("firstName", user.firstName);
              resolve();
            })
            .catch(e => {
              console.log(e);
            });
        });
      }
    },
    getters: {
      loadedPosts(state) {
        return state.loadedPosts;
      },
      isAuthenticated(state) {
        return state.token != null;
      }
    }
  });
};

export default createStore;
