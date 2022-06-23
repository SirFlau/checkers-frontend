import { createApp } from 'vue'
import App from './App.vue'
import '@fontsource/inter/variable.css';
import '@aws-amplify/ui-vue/styles.css';
import AmplifyVue from '@aws-amplify/ui-vue';
import Amplify from 'aws-amplify';

const app = createApp(App);

Amplify.configure({
    aws_appsync_graphqlEndpoint: 'https://api.checkers2022.com/graphql',
    aws_appsync_region: 'eu-west-1',
    aws_appsync_authenticationType: 'AMAZON_COGNITO_USER_POOLS',
    Auth: {
      region: 'eu-west-1',
      identityPoolRegion: 'eu-west-1',
      userPoolId: 'eu-west-1_IGiXEHf1A',
      userPoolWebClientId: '2bg2tfob60s2g2lu8b16ipovvh',
      mandatorySignIn: true,
      authenticationFlowType: 'USER_PASSWORD_AUTH',
    }
  });

app.use(AmplifyVue);
app.mount('#app');
