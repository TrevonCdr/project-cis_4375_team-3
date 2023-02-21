<template>
  <main>
    <div>
      <h1 class="font-bold text-4xl text-blue-700 tracking-widest text-center mt-10">Welcome to Lennin Repizo</h1>
    </div>
  </main>
</template>
<script>
  import axios from "axios";
  import { DateTime } from "luxon";

export default {
  components: {
    
  }, 
  data() {
    return {
      eventData: [],
      //Parameter for search to occur
      searchBy: "",
      firstName: "",
      lastName: "",
      phoneNumber: "",
      labels: [],
      count: [],
      loading: false,
      error: null
    };
  },
  mounted() {
    let apiURL = import.meta.env.VITE_ROOT_API + `/eventdata/total/clientnumber`;
    axios.get(apiURL).then((resp) => {
      this.eventData = resp.data;
    });
    window.scrollTo(0, 0);
    this.fetchData();
  },
  methods: {
    async fetchData() {
      try {
        this.error = null;
        this.loading = true;
        const url = import.meta.env.VITE_ROOT_API + `/eventdata/total/clientnumber`;
        const response = await axios.get(url);
        //"re-organizing" - mapping json from the response
        this.labels = response.data.map((item) => item._id.eventName);
        this.count = response.data.map((item) => item.count);
      } catch (err) {
        if (err.response) {
          // client received an error response (5xx, 4xx)
          this.error = {
            title: "Server Response",
            message: err.message,
          };
        } else if (err.request) {
          // client never received a response, or request never left
          this.error = {
            title: "Unable to Reach Server",
            message: err.message,
          };
        } else {
          // There's probably an error in your code
          this.error = {
            title: "Application Error",
            message: err.message,
          };
        }
      }
      this.loading = false;
    },
    
    routePush(routeName) {
      this.$router.push({ name: routeName });
    },
    formattedDate(datetimeDB) {
      return DateTime.fromISO(datetimeDB).plus({ days: 1 }).toLocaleString();
    },
  },
};
</script>
